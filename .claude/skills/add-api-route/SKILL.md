---
name: add-api-route
description: Guide for adding a new API endpoint to the ReBabel backend. Covers auth, input validation, Supabase RPC calls, response format, and testing.
---

# Adding an API Route

## File Location

Place new routes in `src/pages/api/` under the appropriate feature directory:

- `api/database/v2/{feature}/` -- KVS data operations
- `api/practice/{feature}/` -- AI practice features
- `api/subscriptions/` -- Stripe subscription management
- `api/auth/` -- Auth0 callbacks (rarely need new routes)

Never add routes to `api/ungrouped-legacy/` or `api/database/legacy/`.

## Auth: Always Use withAuth

Every protected route MUST use the `withAuth` wrapper:

```js
import withAuth from '@/lib/withAuth';

export default withAuth(async (req, res) => {
  // Available on req:
  // req.userId     -- ReBabel usr_ ID (use for all DB queries)
  // req.auth0Sub   -- Auth0 ID (rarely needed directly)
  // req.auth0Email -- User's email
  // req.isAdmin    -- Boolean admin check
  // req.log        -- Structured logger with requestId, route, userId

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Your handler logic here
});
```

For admin-only routes: `withAuth(handler, { requireAdmin: true })`

## Identity Policy

CRITICAL: Always use `req.userId` (the ReBabel `usr_` ID), never `req.auth0Sub` for database operations. The `withAuth` wrapper resolves Auth0 -> ReBabel identity automatically via `resolveUserId`.

## Database: Use supabaseKvs for RPC

```js
import { supabaseKvs } from '@/lib/supabaseKvs';

// Call RPC functions in v1_kvs_rebabel schema
const { data, error } = await supabaseKvs.rpc('function_name', {
  p_user_id: req.userId,
  p_entity_id: entityId,
});

if (error) {
  req.log.error('feature.operation_failed', { error: error.message });
  return res.status(500).json({ success: false, error: error.message });
}

return res.status(200).json({ success: true, data });
```

Use `supabaseAdmin` (from `@/lib/supabaseAdmin`) only for legacy direct table queries.

## Response Format

All API routes must return consistent JSON:

```js
// Success
res.status(200).json({ success: true, data: result });
res.status(200).json({ success: true, message: result }); // legacy format, some routes use this

// Error
res.status(400).json({ success: false, error: 'Validation failed' });
res.status(500).json({ success: false, error: 'Internal server error' });
```

## Input Validation

Validate ALL inputs before touching the database:

- Check `req.method` (GET, POST, etc.)
- Validate required body/query parameters
- Sanitize string inputs
- Check ownership/permissions via `req.userId`

## Logging

Use `req.log` (provided by withAuth) for structured logging:

```js
req.log.info('feature.operation_started', { entityId });
req.log.error('feature.operation_failed', { error: err.message });
```

On the client side, use `clientLog` from `@/lib/clientLogger`:

```js
import { clientLog } from '@/lib/clientLogger';
clientLog.error('feature.client_error', { error: err?.message });
```

## Testing

Write Jest tests in `__tests__/` alongside the route:

```js
// src/pages/api/feature/__tests__/my-route.test.js
import handler from '../my-route';

jest.mock('@auth0/nextjs-auth0', () => ({ ... }));
jest.mock('@/lib/supabaseKvs', () => ({ ... }));

describe('POST /api/feature/my-route', () => {
  it('returns 200 with valid input', async () => { ... });
  it('returns 401 without auth', async () => { ... });
  it('returns 400 with invalid input', async () => { ... });
});
```
