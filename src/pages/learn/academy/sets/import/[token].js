import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import MainSidebar from '@/components/Sidebars/AcademySidebar';
import PageHeader from '@/components/ui/PageHeader';
import { TbStack2, TbLoader3 } from 'react-icons/tb';
import ImportProgressOverlay from '@/components/sets/ImportProgressOverlay';
import { FiSearch } from 'react-icons/fi';

export default function ImportSharedSet() {
  const router = useRouter();
  const { token } = router.query;

  const [setData, setSetData] = useState(null);
  const [items, setItems] = useState([]);
  const [itemCount, setItemCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStage, setImportStage] = useState('set'); // 'set' | 'items' | 'linking' | 'done'
  const [importError, setImportError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchSharedSet = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/shared/sets/${token}`);

        if (response.status === 404) {
          setError('This shared set link is no longer active.');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load shared set');
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load shared set');
        }

        setSetData(result.data.set);
        setItems(result.data.items || []);
        setItemCount(result.data.item_count || 0);
      } catch (err) {
        console.error('Error fetching shared set:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedSet();
  }, [token]);

  const handleImport = async () => {
    setIsImporting(true);
    setImportError(null);
    setImportStage('set');
    setImportProgress(15);

    try {
      // Animate set creation stage
      const progressTimer1 = setTimeout(() => setImportProgress(30), 300);

      const response = await fetch('/api/shared/sets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareToken: token }),
      });

      clearTimeout(progressTimer1);

      // Items stage
      setImportStage('items');
      setImportProgress(50);
      await new Promise((r) => setTimeout(r, 400));
      setImportProgress(70);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to import set');
      }

      // Linking stage
      setImportStage('linking');
      setImportProgress(85);
      await new Promise((r) => setTimeout(r, 400));
      setImportProgress(95);
      await new Promise((r) => setTimeout(r, 300));

      // Done
      setImportStage('done');
      setImportProgress(100);
      await new Promise((r) => setTimeout(r, 800));

      router.push(`/learn/academy/sets/study/${result.setEntityId}`);
    } catch (err) {
      console.error('Error importing set:', err);
      setImportError(err.message);
      setIsImporting(false);
      setImportProgress(0);
      setImportStage('set');
    }
  };

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

  if (error) {
    return (
      <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
        <MainSidebar />
        <main className="ml-auto flex-1 px-4 sm:px-6 py-4 flex items-center justify-center">
          <div className="text-center">
            <TbStack2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
              Set Not Found
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/learn/academy/sets')}
              className="px-4 py-2 bg-[#e30a5f] text-white rounded-lg hover:bg-[#c00950] transition-colors"
            >
              Back to Sets
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
      <MainSidebar />

      <main className="ml-auto flex-1 flex flex-col min-h-0 sm:overflow-hidden">
        <Head>
          <title>{setData ? `Import: ${setData.title}` : 'Import Set'}</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <PageHeader
          title={
            isLoading ? (
              <div className="h-7 w-48 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
            ) : (
              setData?.title || 'Shared Set'
            )
          }
          backHref="/learn/academy/sets"
          backLabel="Sets"
          backIcon={
            <TbStack2 className="text-gray-700 dark:text-gray-200 text-lg" />
          }
          meta={
            !isLoading && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#667eea] bg-[#667eea]/10 px-2 py-0.5 rounded-full border border-[#667eea]/20">
                  Shared
                </span>
                {setType && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      setType === 'vocab'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {setType === 'vocab' ? 'Vocabulary' : 'Grammar'}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            )
          }
          actions={
            !isLoading && (
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="px-5 py-2 text-sm text-white bg-[#E30B5C] hover:bg-[#B0104F] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <TbLoader3 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
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
                    Import to My Sets
                  </>
                )}
              </button>
            )
          }
        />

        <div className="w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col px-4 sm:px-6 py-4 relative">
          {/* Import overlay */}
          {isImporting && (
            <ImportProgressOverlay
              importStage={importStage}
              importProgress={importProgress}
              itemCount={itemCount}
            />
          )}

          {isLoading ? (
            <>
              {/* Skeleton header */}
              <div className="lg:hidden flex-shrink-0 pt-11 sm:pt-5 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-14 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
                  <div
                    className="h-4 w-20 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                    style={{ animationDelay: '75ms' }}
                  />
                </div>
                <div
                  className="h-7 w-56 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                  style={{ animationDelay: '150ms' }}
                />
              </div>
              {/* Skeleton search */}
              <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                <div
                  className="h-9 flex-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                  style={{ animationDelay: '200ms' }}
                />
                <div
                  className="h-3 w-16 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                  style={{ animationDelay: '250ms' }}
                />
              </div>
              {/* Skeleton items */}
              <div className="flex-1 min-h-0 bg-white dark:bg-[#1c2b35] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="p-2 space-y-1.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 dark:bg-[#1d2a32] rounded-lg p-2"
                    >
                      <div className="w-full">
                        <div
                          className="h-4 w-2/3 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse mb-1"
                          style={{ animationDelay: `${300 + i * 50}ms` }}
                        />
                        <div
                          className="h-3 w-1/3 rounded bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                          style={{ animationDelay: `${350 + i * 50}ms` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Mobile header */}
              <div className="lg:hidden flex-shrink-0 pt-11 sm:pt-5 mb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium text-[#667eea] bg-[#667eea]/10 px-2 py-0.5 rounded-full border border-[#667eea]/20">
                        Shared
                      </span>
                      {setType && (
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            setType === 'vocab'
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          }`}
                        >
                          {setType === 'vocab' ? 'Vocabulary' : 'Grammar'}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {setData?.title}
                    </h1>
                    {setData?.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {setData.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="px-4 py-2 text-sm text-white bg-[#E30B5C] hover:bg-[#B0104F] font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                  >
                    {isImporting ? (
                      <TbLoader3 className="w-4 h-4 animate-spin" />
                    ) : (
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
                    )}
                    {isImporting ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>

              {importError && (
                <div className="flex-shrink-0 mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                  <strong>Error:</strong> {importError}
                </div>
              )}

              {/* Search */}
              <div className="flex items-center gap-3 mb-3 flex-shrink-0">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0f1a1f] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e30a5f]/30 focus:border-[#e30a5f]"
                  />
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {searchQuery
                    ? `${filteredItems.length} of ${itemCount}`
                    : `${itemCount} items`}
                </span>
              </div>

              {/* Items list */}
              <div className="flex-1 min-h-0 bg-white dark:bg-[#1c2b35] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-y-auto h-full p-2 space-y-1.5">
                  {filteredItems.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="bg-gray-50 dark:bg-[#1d2a32] rounded-lg p-2 shadow-sm overflow-hidden"
                    >
                      <div className="flex items-start gap-2 w-full">
                        <div className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-[10px] font-medium text-gray-600 dark:text-gray-400">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          {item.type === 'vocab' ? (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.english}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 font-japanese">
                                  {item.kana} {item.kanji && `(${item.kanji})`}
                                </div>
                              </div>
                              {item.lexical_category && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex-shrink-0">
                                  {item.lexical_category}
                                </span>
                              )}
                            </div>
                          ) : item.type === 'grammar' ? (
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.title}
                                </div>
                                {item.description && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                              {item.topic && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 flex-shrink-0">
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No items match &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();
