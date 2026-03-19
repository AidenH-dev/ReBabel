import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@auth0/nextjs-auth0/client';
import { TbStack2 } from 'react-icons/tb';
import { FiSearch } from 'react-icons/fi';
import { createClient } from '@supabase/supabase-js';

const SENSITIVE_ITEM_FIELDS = [
  'owner',
  'srs_level',
  'srs_reviewed_last',
  'known_status',
];
const SENSITIVE_SET_FIELDS = ['owner'];

function stripSensitiveFields(obj, fields) {
  const clean = { ...obj };
  for (const f of fields) {
    delete clean[f];
  }
  return clean;
}

export async function getServerSideProps(context) {
  const { token } = context.params;

  if (!token || token.trim().length === 0) {
    return {
      props: { error: 'Missing or invalid share token', token: token || '' },
    };
  }

  try {
    const supabase = createClient(
      process.env.NEXT_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .schema('v1_kvs_rebabel')
      .rpc('get_set_by_share_token', { token: token.trim() });

    if (error) {
      console.error('RPC error:', error);
      return { props: { error: 'Failed to load shared set', token } };
    }

    if (!data) {
      return {
        props: { error: 'This shared set link is no longer active.', token },
      };
    }

    const parsed = typeof data === 'string' ? JSON.parse(data) : data;

    const cleanSet = stripSensitiveFields(
      parsed.set || {},
      SENSITIVE_SET_FIELDS
    );
    const cleanItems = (parsed.items || []).map((item) =>
      stripSensitiveFields(item, SENSITIVE_ITEM_FIELDS)
    );

    return {
      props: {
        setData: cleanSet,
        items: cleanItems,
        itemCount: cleanItems.length,
        token,
        error: null,
      },
    };
  } catch (err) {
    console.error('Shared set SSR error:', err);
    return { props: { error: 'Failed to load shared set', token } };
  }
}

export default function SharedSetPage({
  setData,
  items: initialItems,
  itemCount: initialItemCount,
  token,
  error: serverError,
}) {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();

  const items = initialItems || [];
  const itemCount = initialItemCount || 0;
  const error = serverError;

  // Redirect authenticated users to the in-app import page
  useEffect(() => {
    if (!isUserLoading && user && token) {
      router.replace(`/learn/academy/sets/import/${token}`);
    }
  }, [user, isUserLoading, token, router]);

  const handleSignup = () => {
    const returnTo = `/shared/sets/${token}`;
    router.push(`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const [searchQuery, setSearchQuery] = useState('');

  const setType = setData?.set_type;

  const filteredItems = items.filter((item) => {
    if (searchQuery === '') return true;
    const q = searchQuery.toLowerCase();
    return (
      item.english?.toLowerCase().includes(q) ||
      item.kana?.toLowerCase().includes(q) ||
      item.kanji?.toLowerCase().includes(q) ||
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q)
    );
  });

  const pageTitle = setData
    ? `${setData.title} — Study on ReBabel`
    : 'Shared Study Set — ReBabel';
  const pageDescription = setData?.description
    ? setData.description
    : setData
      ? `A Japanese ${setType === 'vocab' ? 'vocabulary' : setType === 'grammar' ? 'grammar' : 'study'} set with ${itemCount} items. Import free on ReBabel.`
      : 'A shared Japanese study set. Import it to your ReBabel account and start studying with SRS.';
  const pageUrl = `https://www.rebabel.org/shared/sets/${token}`;
  const ogImageUrl = 'https://www.rebabel.org/ReBabelLogo.png';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:site_name" content="ReBabel" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navbar — same as landing page */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/ReBabelIcon.png"
                alt="ReBabel"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-2xl font-bold text-[#e30a5f]">ReBabel</span>
              <span className="ml-1 text-xs bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-2 py-1 rounded-full">
                BETA
              </span>
            </Link>
            {!isUserLoading && !user && (
              <button
                onClick={handleSignup}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 min-h-0 flex flex-col bg-gradient-to-b from-white to-gray-50 mt-16">
        {error ? (
          <div className="text-center px-4 flex-1 flex flex-col items-center justify-center">
            <TbStack2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Set Not Found
            </h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">{error}</p>
            <Link
              href="/"
              className="px-6 py-3 bg-[#E30B5C] text-white rounded-lg hover:bg-[#B0104F] transition-colors text-sm font-medium"
            >
              Go to ReBabel
            </Link>
          </div>
        ) : setData ? (
          <>
            {/* Hero section — compact */}
            <section className="px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex-shrink-0">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Left: title + meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-[#667eea] bg-[#667eea]/10 px-2 py-0.5 rounded-full border border-[#667eea]/20">
                        Shared Set
                      </span>
                      {setType && (
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            setType === 'vocab'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {setType === 'vocab' ? 'Vocabulary' : 'Grammar'}
                        </span>
                      )}
                      <span className="text-xs text-gray-400 font-medium">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                      {setData.title}
                    </h1>
                    {setData.description && (
                      <p className="text-sm text-gray-500 mt-1">
                        {setData.description}
                      </p>
                    )}
                    {Array.isArray(setData.tags) && setData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {setData.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: CTA */}
                  <div className="flex-shrink-0">
                    <div className="flex flex-col items-start sm:items-end gap-1.5">
                      <button
                        onClick={handleSignup}
                        className="px-5 py-2 text-sm font-medium text-[#E30B5C] border border-[#E30B5C] rounded-lg hover:bg-[#E30B5C] hover:text-white transition-colors flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
                        Import Set — Free
                      </button>
                      <p className="text-[10px] text-gray-400">
                        Sign up to import this set to your account
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Items list — matches /sets/study item display */}
            <section className="px-4 sm:px-6 lg:px-8 pb-4 flex-1 min-h-0 flex flex-col">
              <div className="max-w-4xl mx-auto w-full flex-1 min-h-0 flex flex-col">
                {/* Search + count header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]/30 focus:border-[#e30a5f]"
                    />
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {searchQuery
                      ? `${filteredItems.length} of ${itemCount}`
                      : `${itemCount} items`}
                  </span>
                </div>

                {/* Items — scrollable container */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 min-h-0">
                  <div className="overflow-y-auto h-full p-2 space-y-1.5">
                    {filteredItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="bg-gray-50 rounded-lg p-2 shadow-sm overflow-hidden"
                      >
                        <div className="flex items-start gap-2 w-full">
                          <div className="flex-shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-medium text-gray-600">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            {item.type === 'vocab' ? (
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {item.english}
                                  </div>
                                  <div className="text-xs text-gray-600 font-japanese">
                                    {item.kana}{' '}
                                    {item.kanji && `(${item.kanji})`}
                                  </div>
                                </div>
                                {item.lexical_category && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-200 text-gray-600 flex-shrink-0">
                                    {item.lexical_category}
                                  </span>
                                )}
                              </div>
                            ) : item.type === 'grammar' ? (
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {item.title}
                                  </div>
                                  {item.description && (
                                    <div className="text-xs text-gray-600 truncate">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                                {item.topic && (
                                  <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-green-100 text-green-700 flex-shrink-0">
                                    {item.topic}
                                  </span>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredItems.length === 0 && searchQuery && (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500">
                          No items match &ldquo;{searchQuery}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-400">
            &copy; 2025 ReBabel. Study Japanese smarter, not harder.
          </p>
        </div>
      </footer>
    </div>
  );
}
