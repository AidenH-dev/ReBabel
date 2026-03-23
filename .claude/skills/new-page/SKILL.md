---
name: new-page
description: Scaffold a new Next.js page following ReBabel conventions. Keeps pages thin by separating data fetching from UI rendering.
argument-hint: [page-path]
---

# Creating a New Page

## Page Architecture

Pages are thin orchestrators. They handle:

1. Data fetching (SWR or useEffect -- see add-data-fetching skill)
2. Route-level state (URL params, navigation)
3. Layout selection (AuthenticatedLayout or PublicLayout)
4. Composing imported components

Pages do NOT contain:

- Complex UI rendering (extract to components)
- Inline modals or forms (use BaseModal, extract form components)
- Data transformation logic beyond simple mapping (use useMemo or move to lib/)
- Reusable visual patterns (those belong in components)

## Authenticated Page Template

```jsx
import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import useSWR from 'swr';
import fetcher from '@/lib/fetcher';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';

export default function MyPage() {
  const router = useRouter();
  const { id } = router.query;

  // Data fetching -- SWR for read-heavy pages, useEffect for sessions
  const { data, error, isLoading } = useSWR(
    id ? `/api/database/v2/feature/${id}` : null,
    fetcher
  );

  if (isLoading)
    return (
      <AuthenticatedLayout sidebar="academy" title="Page Title">
        {/* Skeleton or spinner */}
      </AuthenticatedLayout>
    );

  if (error)
    return (
      <AuthenticatedLayout sidebar="academy" title="Page Title">
        <PageError message={error.message} />
      </AuthenticatedLayout>
    );

  return (
    <AuthenticatedLayout sidebar="academy" title="Page Title">
      {/* Compose components -- don't write UI logic here */}
      <MyFeatureHeader data={data} />
      <MyFeatureContent items={data.items} />
    </AuthenticatedLayout>
  );
}

export const getServerSideProps = withPageAuthRequired();
```

## Public Page Template

```jsx
import Head from 'next/head';

export default function MyPublicPage({ staticData }) {
  return (
    <>
      <Head>
        <title>Page Title | ReBabel</title>
        <meta name="description" content="..." />
      </Head>
      <nav>
        {/* Use existing navbar pattern from conjugation-practice pages */}
      </nav>
      <main>
        <MyPublicContent data={staticData} />
      </main>
    </>
  );
}

export async function getStaticProps() {
  return { props: { staticData: {} }, revalidate: 86400 };
}
```

## Before You Start

1. Check if an existing page already handles this use case
2. Check `src/components/` for existing components you can reuse (see add-component skill)
3. Decide: authenticated or public? SWR or useEffect?
4. Create the page file, then create any new components it needs in the appropriate tier

## Layout Options

- `<AuthenticatedLayout sidebar="main">` -- dashboard, home, settings
- `<AuthenticatedLayout sidebar="academy">` -- sets, practice, SRS
- `<AuthenticatedLayout sidebar="admin">` -- admin panel
- Public pages use their own nav (see `/japanese-conjugation-practice/` for pattern)

## Sidebar Selection

| sidebar prop | When to use                                |
| ------------ | ------------------------------------------ |
| `"main"`     | Top-level pages (dashboard, home, account) |
| `"academy"`  | Study feature pages (sets, practice, SRS)  |
| `"admin"`    | Admin-only pages                           |
