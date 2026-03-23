---
name: add-data-fetching
description: Guide for adding data fetching to ReBabel pages. Covers when to use SWR vs useEffect, the fetcher pattern, and PremiumContext.
---

# Data Fetching in ReBabel Pages

## Decision: SWR vs useEffect

**Use SWR** for:

- Dashboard and listing pages (sets index, main dashboard)
- Data that benefits from caching (show cached data instantly, refresh in background)
- Pages the user visits frequently (cache reuse across navigations)
- Data that should auto-refresh on tab focus

**Use useEffect + fetch** for:

- Study session pages (quiz, flashcards, SRS due-now, learn-new, fast-review)
- One-shot data loads that don't benefit from caching
- Pages with frequent inline mutations (per-item POST calls during study)
- Pages with custom refresh logic (SRS dashboard has timer-based auto-refresh)

**Why NOT SWR for study sessions:** SWR's cache causes stale data after mutations. If a user completes 3 reviews and navigates back, SWR shows the old cached counts until revalidation fires. Study sessions are stateful and linear -- useEffect is simpler and correct.

## SWR Pattern

```js
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';

// Basic usage
const { data, error, isLoading } = useSWR('/api/endpoint', fetcher);

// Conditional fetch (wait for dependency)
const userId = profileData?.sub;
const { data: setsData } = useSWR(
  userId ? `/api/database/v2/sets/retrieve-list/${userId}` : null,
  fetcher,
  { revalidateOnFocus: true }
);

// Throttle revalidation for frequently-changing data
const { data: dueData } = useSWR(
  userId ? '/api/database/v2/srs/all-due?countOnly=true' : null,
  fetcher,
  { revalidateOnFocus: false, focusThrottleInterval: 10000 }
);
```

The `fetcher` at `src/lib/fetcher.js` handles the `{ success, data, error }` response format and throws on errors so SWR's `error` state works automatically.

## useEffect Pattern (study sessions)

```js
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  if (!id) return;
  const fetchData = async () => {
    try {
      const res = await fetch(`/api/database/v2/srs/set/due/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data || json.message);
    } catch (err) {
      clientLog.error('feature.fetch_failed', { error: err?.message });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, [id]);
```

## PremiumContext

PremiumContext auto-refreshes subscription status and session count on tab visibility change. No need to manually poll.

```js
import { usePremium } from '@/contexts/PremiumContext';

const { canStartSession, sessionsRemaining, dailyLimit, isPremium, isLoading } =
  usePremium();

// Gate session start
if (!canStartSession) {
  /* show limit reached UI */
}

// Optimistic increment after starting a session
const { incrementSessionCount } = usePremium();
incrementSessionCount();
```

## Common Endpoints

| Endpoint                                       | Method | Purpose               | SWR?              |
| ---------------------------------------------- | ------ | --------------------- | ----------------- |
| `/api/auth/me`                                 | GET    | User profile          | Yes               |
| `/api/database/v2/sets/retrieve-list/{userId}` | GET    | User's sets           | Yes               |
| `/api/database/v2/srs/all-due?countOnly=true`  | GET    | Total due items count | Yes (throttled)   |
| `/api/database/v2/stats/dashboard`             | GET    | Dashboard statistics  | Yes               |
| `/api/analytics/user/dashboard`                | GET    | Activity/streak stats | Yes               |
| `/api/database/v2/srs/set/{id}`                | GET    | SRS items for a set   | No (custom timer) |
| `/api/database/v2/srs/set/due/{id}`            | GET    | Due items for review  | No (session)      |
| `/api/database/v2/sets/retrieve-set/{id}`      | GET    | Full set with items   | No (one-shot)     |
