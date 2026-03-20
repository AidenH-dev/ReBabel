# User Identity System -- DB Schema Spec

**Feature:** User Identity System (Issue #81)
**Layer:** 1 -- DB Architecture
**Status:** Approved
**Date:** 2026-03-20

---

## Overview

Auth0 user IDs (`auth0|...`) are currently embedded as `owner`/`user_id` values throughout all KVS tables and two non-KVS tables. This creates tight coupling to Auth0. The user identity system introduces a ReBabel-owned identity layer so that auth provider IDs become a mapping detail rather than the foundation of the data model.

A new KVS table `user_identities` stores USER-IDENTITY entities. Each maps an auth provider ID to a stable ReBabel user ID (`usr_<uuid>`). All existing `owner`/`user_id` values will be migrated from `auth0|...` to `usr_...` format.

---

## 1. New KVS Table: `user_identities`

Standard KVS structure -- no custom columns.

```sql
CREATE TABLE IF NOT EXISTS v1_kvs_rebabel.user_identities (
    id       public.citext NOT NULL PRIMARY KEY,
    entity   public.citext NOT NULL,
    property public.citext NOT NULL,
    value    public.citext,
    ts       timestamptz   NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
    tx       public.citext NOT NULL
);
```

### Indexes

Standard KVS indexes plus one composite index for the hot lookup path:

| Index                                 | Columns              | Purpose                              |
| ------------------------------------- | -------------------- | ------------------------------------ |
| `idx_entity_user_identities`          | `(entity)`           | Fetch all properties of one identity |
| `idx_entity_property_user_identities` | `(entity, property)` | Fetch specific property of identity  |
| `idx_property_user_identities`        | `(property)`         | Filter by property name              |
| `idx_property_value_user_identities`  | `(property, value)`  | Hot path: lookup by auth_provider_id |

---

## 2. Entity Structure (TYPE: USER-IDENTITY)

Each USER-IDENTITY entity represents one ReBabel user account.

| Property             | Example Value          | Notes                                                   |
| -------------------- | ---------------------- | ------------------------------------------------------- |
| `TYPE`               | `USER-IDENTITY`        | Standard KVS type marker                                |
| `auth_provider`      | `auth0`                | Which provider issued the external ID                   |
| `auth_provider_id`   | `auth0\|abc123`        | The provider-specific ID (unique per provider)          |
| `email`              | `user@example.com`     | Informational, from auth profile                        |
| `username`           | `aiden`                | Optional. User-chosen display name. Not set by default. |
| `learning_languages` | `["japanese"]`         | JSON array of languages. Default: `["japanese"]`        |
| `created_at`         | `2026-03-20T00:00:00Z` | When the ReBabel identity was created                   |

**Entity ID format:** `usr_<uuid>` (e.g., `usr_550e8400-e29b-41d4-a716-446655440000`)

### Example rows in `user_identities`

```
id    | entity                                     | property          | value                                      | ts                       | tx
------+--------------------------------------------+-------------------+--------------------------------------------+--------------------------+--------
uuid1 | usr_550e8400-e29b-41d4-a716-446655440000   | TYPE              | USER-IDENTITY                              | 2026-03-20T00:00:00Z     | tx_abc
uuid2 | usr_550e8400-e29b-41d4-a716-446655440000   | auth_provider     | auth0                                      | 2026-03-20T00:00:00Z     | tx_abc
uuid3 | usr_550e8400-e29b-41d4-a716-446655440000   | auth_provider_id  | auth0|abc123                               | 2026-03-20T00:00:00Z     | tx_abc
uuid4 | usr_550e8400-e29b-41d4-a716-446655440000   | email             | user@example.com                           | 2026-03-20T00:00:00Z     | tx_abc
uuid5 | usr_550e8400-e29b-41d4-a716-446655440000   | learning_languages| ["japanese"]                               | 2026-03-20T00:00:00Z     | tx_abc
uuid6 | usr_550e8400-e29b-41d4-a716-446655440000   | created_at        | 2026-03-20T00:00:00Z                       | 2026-03-20T00:00:00Z     | tx_abc
```

---

## 3. RPC Function Specifications

### 3.1 `resolve_user_identity` -- SPEC-DB-011

**Purpose:** Look up or auto-create a USER-IDENTITY entity for a given auth provider ID. This is the primary function called on every authenticated request.

**Signature:**

```sql
CREATE OR REPLACE FUNCTION v1_kvs_rebabel.resolve_user_identity(
  p_auth_provider_id citext,
  p_auth_provider    citext DEFAULT 'auth0',
  p_email            citext DEFAULT NULL
)
RETURNS jsonb
```

**Parameters:**

| Parameter            | Type   | Required | Description                                           |
| -------------------- | ------ | -------- | ----------------------------------------------------- |
| `p_auth_provider_id` | citext | Yes      | The provider-specific ID (e.g., `auth0\|abc123`)      |
| `p_auth_provider`    | citext | No       | Provider name. Default: `auth0`                       |
| `p_email`            | citext | No       | User email from auth profile. Written only on create. |

**Behavior:**

1. Validate `p_auth_provider_id` is not null/empty
2. Query `user_identities` for `property = 'auth_provider_id' AND value = p_auth_provider_id`
3. If found: return `{ user_id: 'usr_...', created: false }`
4. If not found: create new USER-IDENTITY entity with all properties, return `{ user_id: 'usr_...', created: true }`

**Return shape:**

```jsonc
// Existing user
{ "user_id": "usr_550e8400-...", "created": false }

// New user (auto-provisioned)
{ "user_id": "usr_550e8400-...", "created": true }

// Error
{ "error": "auth_provider_id is required" }
```

**Idempotency:** Multiple concurrent calls with the same `p_auth_provider_id` must not create duplicate entities. Use SELECT ... FOR UPDATE or advisory lock.

---

### 3.2 `get_user_identity` -- SPEC-DB-012

**Purpose:** Return all current properties for a given `usr_` entity as a flat JSONB object.

**Signature:**

```sql
CREATE OR REPLACE FUNCTION v1_kvs_rebabel.get_user_identity(
  p_user_id citext
)
RETURNS jsonb
```

**Behavior:**

1. Query `user_identities` with `DISTINCT ON (property) ORDER BY property, ts DESC` for the given entity
2. Build JSONB object from property/value pairs
3. Return `'{}'::jsonb` if entity not found

**Return shape:**

```jsonc
{
  "TYPE": "USER-IDENTITY",
  "auth_provider": "auth0",
  "auth_provider_id": "auth0|abc123",
  "email": "user@example.com",
  "learning_languages": "[\"japanese\"]",
  "created_at": "2026-03-20T00:00:00Z",
}
```

---

### 3.3 `backfill_user_identities` -- SPEC-DB-013

**Purpose:** Scan all existing tables for unique Auth0 IDs and create USER-IDENTITY entities for each. One-time migration function.

**Signature:**

```sql
CREATE OR REPLACE FUNCTION v1_kvs_rebabel.backfill_user_identities()
RETURNS jsonb
```

**Behavior:**

1. Collect all distinct `owner` values from KVS tables: `set`, `kb_vocab`, `kb_grammar`, `user_stats`, `subscriptions`, `admin_info`
2. Collect all distinct `user_id` values from non-KVS tables: `device_tokens`, `notification_preferences`
3. Also collect `user_id` property values from `subscriptions` KVS table
4. Union all, deduplicate
5. For each unique Auth0 ID, call `resolve_user_identity(auth0_id, 'auth0')` to create identity
6. Return `{ identities_created: N, total_auth0_ids_found: M }`

---

### 3.4 `migrate_owners_to_rebabel_ids` -- SPEC-DB-014

**Purpose:** Rewrite all `owner`/`user_id` values from `auth0|...` to `usr_...` format across the database. One-time migration function.

**Signature:**

```sql
CREATE OR REPLACE FUNCTION v1_kvs_rebabel.migrate_owners_to_rebabel_ids()
RETURNS jsonb
```

**Behavior:**

For KVS tables (`set`, `kb_vocab`, `kb_grammar`, `user_stats`, `subscriptions`, `admin_info`, `item_srs`):

1. Find all rows where `property IN ('owner', 'user_id')` and `value LIKE 'auth0|%'`
2. Look up the corresponding `usr_` ID from `user_identities`
3. Insert new rows with `value = usr_` ID (KVS append pattern, preserving history)

For non-KVS tables (`device_tokens`, `notification_preferences`):

1. Find rows where `user_id LIKE 'auth0|%'`
2. UPDATE `user_id` to the corresponding `usr_` ID

For `admin_info` entities with Auth0 IDs baked into entity names (e.g., `bug_reporter_auth0|...`):

1. Find entities where `entity LIKE '%auth0|%'`
2. Create new entities with `usr_` substituted in the entity name
3. Copy all properties from old entity to new entity

**Return shape:**

```jsonc
{
  "kvs_rows_migrated": 234,
  "device_tokens_updated": 5,
  "notification_preferences_updated": 5,
  "admin_entities_migrated": 3,
  "tables_processed": [
    "set",
    "kb_vocab",
    "kb_grammar",
    "user_stats",
    "subscriptions",
    "admin_info",
    "device_tokens",
    "notification_preferences",
  ],
}
```

---

## 4. Query Patterns

### 4.1 Resolve auth provider ID to ReBabel user ID (hot path)

```sql
SELECT entity AS user_id
FROM v1_kvs_rebabel.user_identities
WHERE property = 'auth_provider_id'
  AND value = p_auth_provider_id
ORDER BY ts DESC
LIMIT 1;
```

Uses the `(property, value)` composite index.

### 4.2 Get all current properties for a user

```sql
SELECT DISTINCT ON (property) property, value
FROM v1_kvs_rebabel.user_identities
WHERE entity = p_user_id
ORDER BY property, ts DESC;
```

### 4.3 Find all Auth0 owners across KVS tables

```sql
SELECT DISTINCT value AS auth0_id
FROM v1_kvs_rebabel.set
WHERE property = 'owner' AND value LIKE 'auth0|%'
UNION
SELECT DISTINCT value FROM v1_kvs_rebabel.kb_vocab WHERE property = 'owner' AND value LIKE 'auth0|%'
UNION
-- ... repeat for each table
```

---

## 5. Edge Cases and Constraints

| Case                                            | Handling                                                                       |
| ----------------------------------------------- | ------------------------------------------------------------------------------ |
| NULL or empty `p_auth_provider_id`              | Return error JSONB, do not create entity                                       |
| Concurrent resolve calls for same ID            | Use advisory lock on hash of auth_provider_id to prevent duplicates            |
| Auth0 ID not found during migration             | Skip with warning (should not happen if backfill ran first)                    |
| Entity ID format                                | Always `usr_<uuid>` -- never reuse Auth0 IDs as entity IDs                     |
| `admin_info` entities with Auth0 in entity name | Create parallel entity with `usr_` ID, copy properties                         |
| User with data in multiple tables               | Single USER-IDENTITY entity; backfill deduplicates                             |
| `item_srs` table has no `owner` property        | Skip during backfill; it links via `parent_item_eid` to items that have owners |
| Email updates                                   | Not handled by resolve (only written on create); future function can update    |

---

## 6. Spec Tags

| Tag         | Function                        |
| ----------- | ------------------------------- |
| SPEC-DB-011 | `resolve_user_identity`         |
| SPEC-DB-012 | `get_user_identity`             |
| SPEC-DB-013 | `backfill_user_identities`      |
| SPEC-DB-014 | `migrate_owners_to_rebabel_ids` |

---

## 7. What Each Layer Must Do

### Layer 2 (DB Functions -- tdd-builder in rebabel-database/)

- Create `user_identities` table with standard KVS columns
- Add all 4 indexes
- Implement all 4 RPC functions
- GRANT EXECUTE to service_role for each
- Migration: `supabase/migrations/{timestamp}_user_identity.sql`
- Tests: `supabase/tests/user_identity.sql`

### Layer 3 (API -- in rebabel-nextjs/)

- Create `src/lib/resolveUserId.ts` calling `resolve_user_identity` RPC
- Update all API routes to use `resolveUserId(session.user.sub)` instead of `session.user.sub`
- Update auth callback `afterCallback` to call `resolveUserId` for auto-provision on login

### Layer 4 (Data Migration)

- Run `backfill_user_identities()` to create USER-IDENTITY entities
- Run `migrate_owners_to_rebabel_ids()` to rewrite owner values
- Verify data integrity

---

## 8. pgTAP Test Cases for tdd-builder

### `resolve_user_identity` (SPEC-DB-011)

1. Creates new USER-IDENTITY entity for unknown auth provider ID, returns `created: true`
2. Returns existing entity for known auth provider ID, returns `created: false`
3. Is idempotent -- calling twice with same ID returns same `user_id`
4. Entity ID starts with `usr_`
5. Writes all expected properties (TYPE, auth_provider, auth_provider_id, created_at, learning_languages)
6. Writes email when provided
7. Does not write email property when NULL
8. Returns error when `p_auth_provider_id` is NULL or empty

### `get_user_identity` (SPEC-DB-012)

9. Returns all properties as JSONB for existing user
10. Returns `'{}'::jsonb` for non-existent user
11. Returns latest value when property updated (DISTINCT ON ts DESC)

### `backfill_user_identities` (SPEC-DB-013)

12. Creates identities for all distinct Auth0 IDs found across tables
13. Does not create duplicates for Auth0 IDs appearing in multiple tables
14. Returns correct count of identities created

### `migrate_owners_to_rebabel_ids` (SPEC-DB-014)

15. Inserts new KVS rows with `usr_` values for all `auth0|` owner rows
16. Updates non-KVS table `user_id` columns from `auth0|` to `usr_`
17. Handles `admin_info` entities with Auth0 IDs in entity names
18. Returns migration stats
