# ReBabel – LLM-Tutor

Japanese tutoring platform built with Next.js 14 (Pages Router). Users practice translation, build vocabulary/grammar sets, and study with SRS flashcards as well as AI dynamic practice modules and feedback.

## Dev Setup

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
```

Requires `.env.local` — see **Environment Variables** below.

## Tech Stack

- **Framework**: Next.js 14 (Pages Router), React 18
- **Styling**: Tailwind CSS (dark mode via `dark` class on `<html>`)
- **Auth**: Auth0 (`@auth0/nextjs-auth0`) — `withApiAuthRequired` on all protected routes
- **Database**: Supabase (schema: `v1_kvs_rebabel`) — shared singleton via `src/lib/supabaseAdmin.js`
- **AI**: DeepSeek (primary); traced via LangSmith
- **Payments**: Stripe
- **Analytics**: PostHog, Vercel Analytics
- **Push notifications**: APNS
- **Webhooks**: Peko

## Project Structure

```
src/
  pages/
    api/
      auth/               # Auth0 callbacks, signup, password reset
      database/
        v1/               # Active CRUD routes (learning_materials, sections)
        legacy/           # Deprecated — do not add new routes here
      practice/translate/ # generate.js, grade.js, feedback.js
      cron/               # SRS notification job (runs every minute via Vercel)
      subscriptions/      # Stripe subscription management
      push/               # APNS token registration
      ungrouped-legacy/   # GPT routes pending deprecation — avoid
    learn/
      grammar/            # Grammar lessons & translation exercises
      academy/            # SRS study interface
    admin/
    blog/
  components/
    SRS/                  # Spaced repetition UI
    Set/Features/         # Flashcard session (Quiz, SRS) — MVC pattern
    Practice/             # Translation practice components
    Sidebars/             # MainSidebar, AcademySidebar, AdminSidebar
  contexts/
    PremiumContext.js     # Subscription state + daily session limits
    ThemeContext.js       # Light/dark/system theme with localStorage
  lib/
    langsmith.js          # tracedLLMCall(), traced(), submitFeedback()
    supabaseAdmin.js      # Shared Supabase admin client (service role, no RLS)
```

## Key Patterns

### Auth (all protected API routes)

```js
import { withApiAuthRequired, getSession } from '@auth0/nextjs-auth0';
export default withApiAuthRequired(async function handler(req, res) {
  const session = await getSession(req, res);
  const userId = session.user.sub; // owner_id for all DB queries
});
```

### Supabase

Import the shared singleton — never create a new client per-file:

```js
import { supabaseAdmin } from '@/lib/supabaseAdmin';
// schema is already set to 'v1_kvs_rebabel'
```

Always scope queries to `owner_id` using the Auth0 `user.sub`.

### LLM calls (DeepSeek)

Wrap all LLM fetches with `tracedLLMCall` for automatic LangSmith tracing and cost tracking:

```js
import { tracedLLMCall } from '@/lib/langsmith';
const result = await tracedLLMCall({
  name: 'my-operation',
  provider: 'deepseek',
  model: 'deepseek-chat',
  messages: [...],
  metadata: { userId, ... },
  fetchFn: async () => { /* call the API */ }
});
// result includes { content, usage, runId }
```

- DeepSeek key: `DEEPSEEK_KEY`
- Structured output: `response_format: { type: 'json_object' }`

### API response format

```js
res.status(200).json({ message: data }); // success
res.status(500).json({ error: message }); // error
```

### Nested DB data (two-query pattern)

Fetch parent rows, then batch-fetch children with `.in()`, attach manually:

```js
const { data: parents } = await supabaseAdmin.from('learning_materials')...
const ids = parents.map(p => p.id);
const { data: children } = await supabaseAdmin.from('sections').select().in('learning_material_id', ids);
```

### Premium / session limits

- Free: 1 session/day; Premium: 5 sessions/day
- Check via `PremiumContext`: `canStartSession`, `sessionsRemaining`
- Increment optimistically with `incrementSessionCount()`

## Styling Conventions

Tailwind CSS throughout. Key brand colors:

- **Primary (pink/red)**: `bg-[#da1c60]`, `bg-[#E30B5C]`, `bg-[#B0104F]`
- **Dark backgrounds**: `bg-[#141f25]`, `bg-[#1c2b35]`, `bg-[#404f7d]`
- **Gradients**: `from-[#404f7d] to-blue-600`, `from-cyan-500 to-blue-500`
- Loading spinner: `TbLoader3` from `react-icons/tb`
- Responsive: use `sm:`, `md:`, `lg:`, `xl:` consistently

## File Naming

- Component files: `kebab-case.js` (e.g. `progress-bar.js`)
- API routes: `kebab-case.js` (e.g. `fetch-vocabulary.js`)
- Variables/functions: `camelCase`
- Path alias: `@/*` → `src/*`

## Commit Message Format

Hook enforces a prefix:

```
build:        Changes that affect the build system or external dependencies (e.g. yarn, npm)
development:  In process changes
css:          Page styling changes
seo:          Improving site traffic
confi:        Changes to configuration files and scripts (VSCode, Prettier..)
docs:         Documentation only changes
feat:         A new feature
fix:          A bug fix
improvement:  A code change that streamlines/improves a feature
chore:        Routine maintenance tasks (dependency updates, code cleanup)
vuln:         A patch or change related to a security vulnerability
perf:         A code change that improves performance
refactor:     A code change that neither fixes a bug nor adds a feature
style:        Changes that do not affect meaning (whitespace, formatting, semi-colons)
test:         Adding missing tests or correcting existing tests
auth:         A code change that works with authentication
edit:         A general code change
```

Example: `feat: add anki deck import for vocabulary sets`

## Environment Variables

```env
# AI
DEEPSEEK_KEY=

# Auth0
AUTH0_SECRET=
AUTH0_BASE_URL=
AUTH0_ISSUER_BASE_URL=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_REDIRECT_URI=
AUTH0_DOMAIN=
AUTH0_TRANSACTION_COOKIE_SAME_SITE=
AUTH0_COOKIE_DOMAIN=

# Supabase
SUPABASE_SERVICE_ROLE_KEY=
NEXT_SUPABASE_ANON_KEY=
NEXT_SUPABASE_URL=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_NODE_ENV=

# Push Notifications (APNS)
APNS_KEY_ID=
APNS_TEAM_ID=
APNS_BUNDLE_ID=
APNS_PRODUCTION=
APNS_KEY=

# Webhooks
PEKO_WEBHOOK_URL=
PEKO_WEBHOOK_TOKEN=

# LangSmith (optional for local dev)
LANGSMITH_TRACING=
LANGSMITH_ENDPOINT=
LANGSMITH_API_KEY=
LANGSMITH_PROJECT=
LANGCHAIN_TRACING_V2=
```

## Notes

- Two Next.js config files exist: `next.config.js` (active) and `next.config.mjs` (legacy) — use `next.config.js`
- `src/pages/api/ungrouped-legacy/` and `src/pages/api/database/legacy/` are deprecated
- Vercel cron (`* * * * *`) calls `/api/cron/srs-notifications` every minute in production
- WASM support is enabled in webpack config (for wanakana or similar)
- No test framework is currently set up
