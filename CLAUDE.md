# ReBabel -- rebabel-nextjs

Japanese tutoring platform. Next.js 14 (Pages Router), React 18, Tailwind CSS.

## Dev Setup

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm test           # Jest + React Testing Library
```

## Tech Stack

| Layer         | Tech                                                                |
| ------------- | ------------------------------------------------------------------- |
| Framework     | Next.js 14 (Pages Router), React 18                                 |
| Styling       | Tailwind CSS (dark mode via `dark` class on `<html>`)               |
| Auth          | Auth0 (`@auth0/nextjs-auth0`) -- all routes via `withAuth` wrapper  |
| Database      | Supabase KVS/EAV (`v1_kvs_rebabel` schema) via `supabaseKvs` client |
| Data fetching | SWR for dashboards/listings, useEffect for study sessions           |
| AI            | DeepSeek via `tracedLLMCall()` (LangSmith tracing)                  |
| Payments      | Stripe                                                              |
| Analytics     | PostHog, Vercel Analytics                                           |

## Project Structure

```
src/
  pages/
    api/
      auth/                 # Auth0 callbacks
      database/v1/          # CRUD routes (learning_materials, sections)
      database/v2/          # KVS routes (sets, SRS, stats, user)
      practice/translate/   # LLM-powered translation practice
      subscriptions/        # Stripe subscription management
      cron/                 # SRS notification job
    learn/academy/          # SRS study interface, sets, practice
    admin/                  # Admin panel
  components/               # Tiered component system (see below)
  contexts/                 # PremiumContext, ThemeContext, PreferencesContext
  hooks/                    # useAnalyticsSession, useActionTrail, etc.
  lib/
    withAuth.ts             # Auth wrapper: session + resolveUserId + logging
    supabaseAdmin.js        # Legacy Supabase client (direct table access)
    supabaseKvs.ts          # KVS schema client (RPC calls)
    fetcher.js              # SWR fetcher for { success, data, error } responses
    study/                  # Shared study utils (answerValidation, mcOptionGeneration, etc.)
    setActions.js           # Shared set actions (markSetStudied)
    conjugation.js          # Conjugation engine (imports forms from Conjugation/shared/)
    langsmith.js            # tracedLLMCall(), traced(), submitFeedback()
    srs/constants.ts        # SRS time factors, isItemDue()
    clientLogger.ts         # Client-side structured logging
```

## Component Organization (Tiered System)

**Tier 1 -- Flat** (1-4 files): `blog/`, `KanjiPractice/`, `Popups/`, `SetImport/`, `Sidebars/`
**Tier 2 -- Feature Dir** (medium complexity): `BugReporter/`, `SetCreator/`, `SetViewer/`, `SRS/`, `Tables/`, `Translate/`, `ui/`
**Tier 3 -- Feature Hierarchy** (shared/ + variants): `Conjugation/` (Public/Premium/shared), `Set/Features/Field-Card-Session/` (Quiz/SRS/shared)

Conventions: PascalCase dirs, `PascalCase.jsx` components, `camelCase.js` utils, MVC subdirs (`controllers/`, `views/`, `models/`).

## Key Patterns

### API Routes -- use withAuth

```js
import withAuth from '@/lib/withAuth';
export default withAuth(async (req, res) => {
  // req.userId (usr_ ReBabel ID), req.auth0Sub, req.isAdmin, req.log
  const { data } = await supabaseKvs.rpc('function_name', {
    p_user_id: req.userId,
  });
  res.status(200).json({ success: true, data });
});
```

### Data Fetching -- SWR for dashboards, useEffect for sessions

```js
// Dashboard/listing pages: use SWR (auto-revalidation, caching)
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
const { data, error, isLoading } = useSWR('/api/endpoint', fetcher);

// Study sessions (quiz, SRS, flashcards): use useEffect (one-shot, mutation-heavy)
```

### Supabase -- use supabaseKvs for KVS, supabaseAdmin for legacy

```js
import { supabaseKvs } from '@/lib/supabaseKvs'; // RPC calls to v1_kvs_rebabel
import { supabaseAdmin } from '@/lib/supabaseAdmin'; // Direct table access (legacy)
```

### LLM Calls

Wrap with `tracedLLMCall` from `@/lib/langsmith` for LangSmith tracing. Provider: DeepSeek (`deepseek-chat`).

### Premium / Session Limits

- Free: 1 translate session/day; Premium: 5/day
- `PremiumContext` auto-refreshes on tab visibility change
- Check: `canStartSession`, `sessionsRemaining`; optimistic: `incrementSessionCount()`

## Styling

Brand colors: `bg-brand-pink` (`#e30a5f`), `bg-brand-pink-hover`. Dark surfaces: `bg-surface-page`, `bg-surface-card`, `bg-surface-elevated`, `bg-surface-deep`. Loading: `TbLoader3` spinner or `animate-pulse` skeleton.

## File Naming

- Components: `PascalCase.jsx` | Utilities: `camelCase.js` | API routes: `kebab-case.js`
- Path alias: `@/*` -> `src/*` (always use `@/`, never `../`)

## Commit Format

Hook-enforced prefix: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `css:`, `test:`, `perf:`, `auth:`, `edit:`, `improvement:`, `style:`, `build:`, `seo:`, `vuln:`

## Testing

Jest + React Testing Library. Tests in `__tests__/` dirs or colocated `.test.js` files. Mock patterns: Auth0 session, Supabase RPC, global fetch.

## Notes

- `next.config.js` is active (`next.config.mjs` is legacy)
- `pages/api/ungrouped-legacy/` and `pages/api/database/legacy/` are deprecated
- Vercel cron runs `/api/cron/srs-notifications` every minute
- WASM enabled in webpack (for wanakana)
