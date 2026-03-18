# User Preferences -- DB Schema Design

**Spec ID:** SPEC-DB-010
**Date:** 2026-03-18

---

## 1. Feature Summary

Users need persistent preferences that sync across devices. Currently, theme, sets view mode, and sets sort order are stored only in `localStorage`, meaning they reset on new devices or cleared browsers. This feature introduces a server-side preferences entity per user, stored in the KVS system, with RPC functions to read and upsert preferences. The UI will hydrate from the server on login and fall back to localStorage for unauthenticated or offline states.

**Data operations required:**

- **Read:** Fetch all current preferences for a user (one query, returns a flat JSON object)
- **Write:** Upsert one or more preferences at a time (partial updates -- only changed keys)
- **No delete:** Preferences are never deleted, only overwritten

---

## 2. Entity Design

### Decision: Single entity type, flat properties

One entity per user holds all preferences. Properties use a `pref.` namespace prefix to avoid collision if the table is ever shared. All preferences live in the same entity regardless of category (UI vs organization) because:

- They share identical access patterns (always read all at once per user, always scoped to one user)
- There is no reason to query UI prefs separately from org prefs at the DB level
- A single entity means a single DISTINCT ON query to get everything
- Adding new preferences later is just adding new property rows -- no schema change

### KVS Table: `user_stats`

**Why `user_stats`:** This table already stores per-user data (session tracking). Preferences are per-user state. The alternatives are worse:

- `subscriptions` is specifically for Stripe billing state
- `admin_info` is for admin/bug report data
- `set` / `kb_vocab` / `kb_grammar` are for content entities
- `relations` is for entity links
- `item_srs` is for SRS tracking
- A new table is unnecessary -- `user_stats` is the general per-user bucket

### Entity ID Convention

Entity ID: `pref_{uuid}` (e.g., `pref_a1b2c3d4-...`)

One entity per user. Found by querying `property = 'owner' AND value = {user_id}`.

### Property List

| Property              | Example Value   | Nullable | Update Strategy      | Notes                                      |
| --------------------- | --------------- | -------- | -------------------- | ------------------------------------------ |
| `TYPE`                | `USER-PREFS`    | no       | immutable            | Entity type discriminator                  |
| `owner`               | `auth0\|abc123` | no       | immutable            | Auth0 user sub                             |
| `pref.theme`          | `dark`          | yes      | insert-new (history) | `light`, `dark`, `dusk`, `cream`, `system` |
| `pref.sets_view`      | `grid`          | yes      | insert-new (history) | `grid`, `list`                             |
| `pref.sets_sort`      | `recent`        | yes      | insert-new (history) | `recent`, `az`, `size`                     |
| `pref.sets_size_desc` | `true`          | yes      | insert-new (history) | `true`, `false`                            |

**Extensibility:** New preferences are added by inserting rows with new `pref.*` property names. No migration needed. The RPC functions return all `pref.*` properties dynamically.

**Why insert-new (history) for updates:** Preference changes are cheap and infrequent. Keeping history costs almost nothing and lets us answer questions like "when did this user switch to dark mode?" if ever needed. The DISTINCT ON query gets the latest value regardless.

---

## 3. Concrete Example State

User `auth0|user789` has set their theme to `dusk`, views sets as a grid, and sorts by name A-Z:

```
id                                   | entity                              | property          | value           | ts                      | tx
-------------------------------------|--------------------------------------|-------------------|-----------------|-------------------------|--------------------------------------
f1a2b3c4-0000-0000-0000-000000000001 | pref_d4e5f6a7-1111-2222-3333-444444 | TYPE              | USER-PREFS      | 2026-03-01 10:00:00+00  | tx_00000001-aaaa-bbbb-cccc-dddddddddddd
f1a2b3c4-0000-0000-0000-000000000002 | pref_d4e5f6a7-1111-2222-3333-444444 | owner             | auth0|user789   | 2026-03-01 10:00:00+00  | tx_00000001-aaaa-bbbb-cccc-dddddddddddd
f1a2b3c4-0000-0000-0000-000000000003 | pref_d4e5f6a7-1111-2222-3333-444444 | pref.theme        | system          | 2026-03-01 10:00:00+00  | tx_00000001-aaaa-bbbb-cccc-dddddddddddd
f1a2b3c4-0000-0000-0000-000000000004 | pref_d4e5f6a7-1111-2222-3333-444444 | pref.theme        | dusk            | 2026-03-10 14:30:00+00  | tx_00000002-aaaa-bbbb-cccc-dddddddddddd
f1a2b3c4-0000-0000-0000-000000000005 | pref_d4e5f6a7-1111-2222-3333-444444 | pref.sets_view    | grid            | 2026-03-01 10:00:00+00  | tx_00000001-aaaa-bbbb-cccc-dddddddddddd
f1a2b3c4-0000-0000-0000-000000000006 | pref_d4e5f6a7-1111-2222-3333-444444 | pref.sets_sort    | az              | 2026-03-05 09:00:00+00  | tx_00000003-aaaa-bbbb-cccc-dddddddddddd
```

**Current state** (DISTINCT ON property, ORDER BY ts DESC):

```json
{
  "TYPE": "USER-PREFS",
  "owner": "auth0|user789",
  "pref.theme": "dusk",
  "pref.sets_view": "grid",
  "pref.sets_sort": "az"
}
```

Note: `pref.sets_size_desc` has no rows -- it was never set. The client treats missing preferences as defaults.

---

## 4. Relations

None. User preferences are a standalone entity. They do not link to sets, vocab items, or any other entity. The `owner` property provides the user association directly.

---

## 5. Query Patterns for Layer 2

### 5.1 `get_user_preferences`

**Function name:** `get_user_preferences`
**Inputs:**

- `p_user_id citext` -- Auth0 user sub

**Query pattern:**

1. Find the preferences entity: `SELECT entity FROM user_stats WHERE property = 'owner' AND value = p_user_id` among entities that have `TYPE = 'USER-PREFS'`. Since `user_stats` also has session entities with `owner`, we need to filter: find entities where `property = 'TYPE' AND value = 'USER-PREFS'`, then among those find the one where `property = 'owner' AND value = p_user_id`.
2. Efficient approach: query for entity where `property = 'owner' AND value = p_user_id`, then verify it has `TYPE = 'USER-PREFS'`. Or use a subquery/CTE.
3. Once entity is found, `DISTINCT ON (property) ... ORDER BY property, ts DESC` to get current state.
4. Build JSONB from the property/value pairs. Strip `TYPE` and `owner` from the result -- the caller only needs `pref.*` keys.
5. Strip the `pref.` prefix from keys in the returned JSON for cleaner client consumption (e.g., return `"theme": "dusk"` not `"pref.theme": "dusk"`).

**Returns:** `JSONB` -- flat object of preferences, or empty `{}` if no preferences entity exists. Example:

```json
{
  "theme": "dusk",
  "sets_view": "grid",
  "sets_sort": "az"
}
```

Returning `{}` (not NULL) for a user with no preferences makes the client simpler -- it can always merge with defaults.

---

### 5.2 `upsert_user_preferences`

**Function name:** `upsert_user_preferences`
**Inputs:**

- `p_user_id citext` -- Auth0 user sub
- `p_prefs jsonb` -- partial preferences object, e.g. `{"theme": "dark", "sets_view": "list"}`

**Query pattern:**

1. Find existing preferences entity (same lookup as `get_user_preferences`).
2. If no entity exists, create one: generate `entity_id = 'pref_' || gen_random_uuid()`, insert `TYPE = 'USER-PREFS'` and `owner = p_user_id` rows.
3. Generate `tx_uuid`.
4. For each key/value in `p_prefs`:
   - Prepend `pref.` to the key to form the property name.
   - **Validate** the key is in the allowed set (`theme`, `sets_view`, `sets_sort`, `sets_size_desc`). Reject unknown keys.
   - **Validate** the value is in the allowed values for that key. Reject invalid values.
   - Check current value via `DISTINCT ON` or `ORDER BY ts DESC LIMIT 1`. Only insert if the value has changed (skip no-op writes, same pattern as `upsert_subscription`).
   - Insert new row with current timestamp.
5. Return success with entity_id and count of actually inserted rows.

**Validation rules:**
| Key | Allowed Values |
|-----|---------------|
| `theme` | `light`, `dark`, `dusk`, `cream`, `system` |
| `sets_view` | `grid`, `list` |
| `sets_sort` | `recent`, `az`, `size` |
| `sets_size_desc` | `true`, `false` |

**Returns:** `JSONB`

```json
{
  "success": true,
  "entity_id": "pref_d4e5f6a7-...",
  "transaction_id": "tx_...",
  "inserted_count": 2
}
```

If all values are unchanged, `inserted_count` is 0 and no rows are written. This is not an error.

---

## 6. Migration Strategy

### New data, no backfill needed

This creates a new entity type (`USER-PREFS`) in the existing `user_stats` table. No existing data is affected. Users who have never set preferences will simply have no entity, and the `get_user_preferences` function returns `{}`.

### No backfill from localStorage

Existing localStorage preferences cannot be backfilled from the server side. The frontend migration strategy is:

1. On first authenticated page load, call `get_user_preferences`.
2. If the result is `{}` (empty), push current localStorage values to the server via `upsert_user_preferences`.
3. On subsequent loads, server values take precedence over localStorage. Write to both on change.

This is a Layer 3/4 concern, not a DB concern. No migration SQL is needed for backfill.

### Indexes

No new indexes needed. The existing indexes on `user_stats` cover the query patterns:

- `(property, value)` index -- used for the owner lookup (`property = 'owner' AND value = user_id`)
- `(entity, property)` index -- used for DISTINCT ON current state
- `(entity)` index -- used for fetching all rows of an entity

**Verify existing indexes include a composite on `(property, value)`:** If not, the owner lookup will do a sequential scan filtered by property. Given that `user_stats` has an index on `(property)`, the query planner should handle this reasonably. If performance is a concern at scale, a composite index on `(property, value)` would help, but this is unlikely to matter for a per-user singleton lookup.

### EAV performance

No concerns. Each user has exactly one preferences entity with at most ~10 property rows. The DISTINCT ON query touches a tiny number of rows per entity. Write frequency is very low (users change preferences rarely). This is one of the lightest possible uses of the EAV pattern.
