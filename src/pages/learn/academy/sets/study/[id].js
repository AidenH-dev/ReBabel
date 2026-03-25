// pages/learn/academy/sets/study/[id].js

/**
 * ViewSet Page
 *
 * Main page for viewing and managing a study set.
 * This page orchestrates three main sections:
 * 1. SetHeader - Displays set info, breadcrumbs, edit/export controls
 * 2. PracticeOptions - Quiz and flashcard launch buttons
 * 3. ItemsManagement - List/grid view of vocabulary and grammar items
 *
 * Responsibilities:
 * - Fetches set data and items from API
 * - Manages page-level state (setData, items, userProfile)
 * - Coordinates updates between child components
 * - Handles authentication and error states
 */

// ============================================================================
// IMPORTS
// ============================================================================

import AuthenticatedLayout from '@/components/ui/AuthenticatedLayout';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// Component imports
import MasterItemsManagement from '@/components/SetViewer/ItemsManagement/MasterItemsManagement';
import PracticeOptions from '@/components/SetViewer/PracticeOptions/MasterPracticeOptions';
import MasterSetHeader from '@/components/SetViewer/SetHeader/MasterSetHeader';
import { safeParseArray } from '@/lib/study/itemTransform';
import PageHeader from '@/components/ui/PageHeader';
import {
  TbStack2,
  TbRepeat,
  TbRepeatOff,
  TbShare2,
  TbTrash,
  TbArrowBackUp,
  TbLanguageHiragana,
} from 'react-icons/tb';
import { FiEdit2, FiMoreVertical, FiTag } from 'react-icons/fi';
import { clientLog } from '@/lib/clientLogger';
import BaseModal from '@/components/ui/BaseModal';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ViewSet() {
  const router = useRouter();
  const { id } = router.query; // Set ID from URL params

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref to access MasterSetHeader actions from PageHeader
  const headerActionsRef = useRef({});
  const [showHeaderOptions, setShowHeaderOptions] = useState(false);
  const headerOptionsRef = useRef(null);

  // Auto-categorize state (triggered from three-dots menu)
  const [showAutoCategorizeModal, setShowAutoCategorizeModal] = useState(false);
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);
  const [autoCategorizeResult, setAutoCategorizeResult] = useState(null);

  useEffect(() => {
    if (!showHeaderOptions) return;
    const handleClick = (e) => {
      if (
        headerOptionsRef.current &&
        !headerOptionsRef.current.contains(e.target)
      ) {
        setShowHeaderOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showHeaderOptions]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const titleInputRef = useRef(null);

  // User authentication data
  const [userProfile, setUserProfile] = useState(null);

  // Set metadata and configuration
  const [setData, setSetData] = useState({
    id: id,
    title: '',
    description: '',
    owner: '',
    dateCreated: '',
    lastStudied: '',
    srsEnabled: false, // SRS status from database
    set_type: null, // 'vocab', 'grammar', or null for legacy sets
    auto_categorized: false,
    tags: [],
    itemCount: 0,
    studyStats: {
      known: 0,
      learning: 0,
      unknown: 0,
      lastScore: 0,
    },
  });

  // Study items (vocabulary and grammar)
  const [items, setItems] = useState([]);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  /**
   * Fetch set data and items from API
   * Runs when component mounts or when ID changes
   */
  useEffect(() => {
    if (!id) return;

    const fetchSetData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Call API to retrieve set and its items
        const response = await fetch(
          `/api/database/v2/sets/retrieve-set/${id}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch set: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load set data');
        }

        // Extract data from API response
        const apiData = result.data;
        const setInfo = apiData.data?.set;
        const setItemsAPI = apiData.data?.items || [];
        const metadata = apiData.metadata;

        if (!setInfo) {
          throw new Error('Invalid set data structure received from API');
        }

        // Populate set metadata
        setSetData({
          id: apiData.set_id,
          title: setInfo.title || 'Untitled Set',
          description: setInfo.description?.toString() || '',
          owner: setInfo.owner || '',
          dateCreated: setInfo.date_created || '',
          lastStudied: setInfo.last_studied || '',
          srsEnabled: setInfo.srs_enabled === 'true',
          set_type: setInfo.set_type || null,
          auto_categorized: setInfo.auto_categorized === 'true',
          tags: Array.isArray(setInfo.tags) ? setInfo.tags : [],
          itemCount: metadata?.total_items || 0,
          studyStats: {
            known: 0,
            learning: 0,
            unknown: 0,
            lastScore: 0,
          },
        });

        // Transform API items into consistent format for UI
        const transformedItems = Array.isArray(setItemsAPI)
          ? setItemsAPI
              .map((item, index) => {
                // Handle vocabulary items
                if (item.type === 'vocab' || item.type === 'vocabulary') {
                  return {
                    id: item.id || `temp-vocab-${index}`,
                    type: 'vocabulary',
                    english: item.english || '',
                    kana: item.kana || '',
                    kanji: item.kanji || '',
                    lexical_category: item.lexical_category || '',
                    status: item.known_status || 'unknown',
                    srs_level: item.srs_level || 0,
                    example_sentences: safeParseArray(item.example_sentences),
                    tags: safeParseArray(item.tags),
                  };
                }
                // Handle grammar items
                else if (item.type === 'grammar') {
                  return {
                    id: item.id || `temp-grammar-${index}`,
                    type: 'grammar',
                    title: item.title || '',
                    description: item.description || '',
                    topic: item.topic || '',
                    status: item.known_status || 'unknown',
                    srs_level: item.srs_level || 0,
                    notes: item.notes || '',
                    example_sentences: safeParseArray(
                      item.example_sentences
                    ).map((ex) =>
                      typeof ex === 'string'
                        ? ex
                        : `${ex.japanese || ''} (${ex.english || ''})`
                    ),
                    tags: safeParseArray(item.tags),
                  };
                }
                return null;
              })
              .filter(Boolean)
          : [];

        setItems(transformedItems);
      } catch (err) {
        clientLog.error('set.fetch_failed', {
          error: err?.message || String(err),
        });
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetData();
  }, [id]);

  /**
   * Fetch user profile for authentication and ownership checks
   * Runs once on component mount
   */
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        clientLog.error('set.profile_fetch_failed', {
          error: error?.message || String(error),
        });
      }
    };
    fetchUserProfile();
  }, []);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Updates set metadata when child components make changes
   * @param {Object} updates - Partial setData object with updated fields
   */
  const handleSetDataUpdate = (updates) => {
    setSetData((prev) => {
      const newState = { ...prev, ...updates };

      // Handle srsEnabled property if it's being updated
      if ('srsEnabled' in updates && typeof updates.srsEnabled === 'boolean') {
        newState.srsEnabled = updates.srsEnabled;
      }

      return newState;
    });
  };

  /**
   * Handles successful set deletion by redirecting to sets list
   */
  const handleDeleteSet = () => {
    router.push('/learn/academy/sets');
  };

  const handleRunAutoCategorize = async () => {
    if (!setData?.id) return;
    setIsAutoCategorizing(true);
    setAutoCategorizeResult(null);
    try {
      const response = await fetch('/api/database/v2/sets/auto-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set_id: setData.id }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to auto-categorize');
      }
      // Update local items
      if (result.results && result.results.length > 0) {
        const categoryMap = {};
        for (const r of result.results) {
          categoryMap[r.entity_id] = r.lexical_category;
        }
        setItems((prev) =>
          prev.map((item) =>
            categoryMap[item.id]
              ? { ...item, lexical_category: categoryMap[item.id] }
              : item
          )
        );
      }
      let msg = `Categorized ${result.categorized_count} item${result.categorized_count !== 1 ? 's' : ''}`;
      if (result.missing_kanji_count > 0) {
        msg += `. ${result.missing_kanji_count} item${result.missing_kanji_count !== 1 ? 's' : ''} missing kanji.`;
      }
      setAutoCategorizeResult(msg);
      setSetData((prev) => ({ ...prev, auto_categorized: true }));
      // Also persist via the update API (auto-categorize endpoint already does this,
      // but ensure it's set in case it was cleared)
      fetch('/api/database/v2/sets/update-from-full-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'set',
          entityId: setData.id,
          updates: { auto_categorized: 'true' },
        }),
      }).catch(() => {});
    } catch (err) {
      setAutoCategorizeResult(`Error: ${err.message}`);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const startEditingTitle = () => {
    setEditTitle(setData.title);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitle = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === setData.title) {
      setIsEditingTitle(false);
      return;
    }
    setIsSavingTitle(true);
    try {
      const response = await fetch(
        '/api/database/v2/sets/update-from-full-set',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityType: 'set',
            entityId: setData.id,
            updates: { title: trimmed },
          }),
        }
      );
      const result = await response.json();
      if (response.ok && result.success) {
        handleSetDataUpdate({ title: trimmed });
      }
    } catch (err) {
      clientLog.error('set.title_save_failed', {
        error: err?.message || String(err),
      });
    } finally {
      setIsSavingTitle(false);
      setIsEditingTitle(false);
    }
  };

  // ============================================================================
  // ERROR STATE RENDERING
  // ============================================================================

  if (error) {
    return (
      <AuthenticatedLayout
        sidebar="academy"
        title="Error Loading Set"
        variant="fixed"
        mainClassName="px-4 sm:px-6 py-4 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
            Error Loading Set
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/learn/academy/sets')}
            className="px-4 py-2 bg-brand-pink text-white rounded-lg hover:bg-[#c00950] transition-colors"
          >
            Back to Sets
          </button>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <AuthenticatedLayout
      sidebar="academy"
      sidebarProps={{ hideMobileMenu: true }}
      title={`${setData.title} - View Set`}
      variant="fixed"
      mainClassName="min-h-0 sm:overflow-hidden"
    >
      {/* Desktop sticky header */}
      <PageHeader
        title={
          isLoading ? (
            <div className="h-7 w-48 rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse" />
          ) : (
            <span className="flex items-center gap-2">
              <span className="relative inline-grid">
                {/* Hidden sizer — keeps width consistent between text and input */}
                <span className="invisible col-start-1 row-start-1 text-2xl font-bold whitespace-pre px-px">
                  {isEditingTitle ? editTitle || ' ' : setData.title}
                </span>
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={saveTitle}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    disabled={isSavingTitle}
                    className="col-start-1 row-start-1 text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-brand-pink/50 outline-none m-0 p-0 px-px leading-normal w-full"
                  />
                ) : (
                  <span
                    className="col-start-1 row-start-1 text-2xl font-bold text-gray-900 dark:text-white cursor-pointer px-px"
                    onClick={startEditingTitle}
                  >
                    {setData.title}
                  </span>
                )}
              </span>
              <FiEdit2
                className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 cursor-pointer"
                onClick={isEditingTitle ? undefined : startEditingTitle}
              />
            </span>
          )
        }
        backHref="/learn/academy/sets"
        backLabel="Sets"
        backIcon={
          <TbStack2 className="text-gray-700 dark:text-gray-200 text-lg" />
        }
        meta={
          !isLoading && (
            <button
              onClick={() => headerActionsRef.current?.openSRSModal?.()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border relative overflow-hidden transition-all hover:scale-105 cursor-pointer ${
                setData.srsEnabled
                  ? 'bg-green-300/20 border-green-400 dark:border-green-400 hover:bg-green-300/30'
                  : 'bg-gray-100/60 dark:bg-gray-800/60 border-gray-300 dark:border-gray-600 hover:bg-gray-200/60 dark:hover:bg-gray-700/60'
              }`}
              title="Click to configure SRS settings"
            >
              {setData.srsEnabled ? (
                <>
                  <TbRepeat className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                  <span className="text-xs font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-300 dark:to-pink-300 bg-clip-text text-transparent">
                    SRS Enabled
                  </span>
                </>
              ) : (
                <>
                  <TbRepeatOff className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-500">
                    SRS Disabled
                  </span>
                </>
              )}
            </button>
          )
        }
        actions={
          !isLoading && (
            <>
              <button
                onClick={() => headerActionsRef.current?.openShareModal?.()}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                title="Share Set"
              >
                <TbShare2 className="w-4.5 h-4.5" />
              </button>
              <div className="relative" ref={headerOptionsRef}>
                <button
                  onClick={() => setShowHeaderOptions((v) => !v)}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  title="More"
                >
                  <FiMoreVertical className="w-4.5 h-4.5" />
                </button>
                {showHeaderOptions && (
                  <div className="absolute right-0 dark:text-white mt-1 w-56 bg-white dark:bg-surface-card rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <button
                      onClick={() => {
                        headerActionsRef.current?.openEdit?.();
                        setShowHeaderOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-elevated flex items-center gap-2"
                    >
                      <FiEdit2 className="inline w-4 h-4" />
                      Edit Set Details
                    </button>
                    <button
                      onClick={() => {
                        headerActionsRef.current?.openShareModal?.();
                        setShowHeaderOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-elevated flex items-center gap-2"
                    >
                      <TbShare2 className="inline w-4 h-4" />
                      Share Set
                    </button>
                    <button
                      onClick={() => {
                        headerActionsRef.current?.openSRSModal?.();
                        setShowHeaderOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-elevated flex items-center gap-2"
                    >
                      <TbRepeat className="inline w-4 h-4" />
                      SRS Settings
                    </button>
                    {(setData.set_type === 'vocab' || !setData.set_type) && (
                      <button
                        onClick={() => {
                          setShowHeaderOptions(false);
                          setShowAutoCategorizeModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-elevated flex items-center gap-2"
                      >
                        <FiTag className="inline w-4 h-4" />
                        Auto-categorize
                      </button>
                    )}
                    <div className="my-1 border-t border-gray-200 dark:border-gray-700" />
                    <button
                      onClick={() => {
                        headerActionsRef.current?.openDelete?.();
                        setShowHeaderOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"
                    >
                      <TbTrash className="inline w-4 h-4" />
                      Delete Set
                    </button>
                  </div>
                )}
              </div>
            </>
          )
        }
      />

      {/* Content container with max width */}
      <div className="w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col px-4 sm:px-6 py-6 lg:py-4">
        {/* Section 1: Set Header - Breadcrumbs, title, edit, export (mobile + inline details) */}
        <MasterSetHeader
          setData={setData}
          items={items}
          onSetDataUpdate={handleSetDataUpdate}
          onDeleteSet={handleDeleteSet}
          srsEnabled={setData.srsEnabled}
          actionsRef={headerActionsRef}
        />
        {/* Section 2: Practice Options - Quiz and flashcard buttons */}
        {isLoading ? (
          <div className="grid gap-3 mb-3 pt-2 sm:pt-0 grid-cols-1 sm:grid-cols-2 sm:h-40">
            {/* SRS module skeleton */}
            <div className="rounded-lg border border-black/5 dark:border-white/10 bg-white dark:bg-surface-card p-3 flex flex-col justify-between">
              <div className="flex gap-2 mb-2">
                <div className="flex-1 h-10 rounded-lg bg-black/[0.05] dark:bg-white/[0.05] animate-pulse" />
              </div>
              <div className="flex gap-3 flex-1">
                <div className="grid grid-cols-2 gap-3 sm:w-1/2">
                  <div
                    className="h-full rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                    style={{ animationDelay: '50ms' }}
                  />
                  <div
                    className="h-full rounded-lg bg-black/[0.06] dark:bg-white/[0.06] animate-pulse"
                    style={{ animationDelay: '100ms' }}
                  />
                </div>
                <div
                  className="flex-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] animate-pulse"
                  style={{ animationDelay: '150ms' }}
                />
              </div>
            </div>
            {/* Quiz + Flashcards skeleton */}
            <div className="grid gap-2 w-full grid-cols-2 sm:grid-cols-1 sm:h-40">
              <div className="rounded-lg bg-black/[0.05] dark:bg-white/[0.05] animate-pulse p-3 sm:p-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-black/[0.06] dark:bg-white/[0.06]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-20 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                  <div className="h-3 w-36 rounded bg-black/[0.04] dark:bg-white/[0.04] hidden sm:block" />
                </div>
              </div>
              <div
                className="rounded-lg bg-black/[0.05] dark:bg-white/[0.05] animate-pulse p-3 sm:p-4 flex items-center gap-3"
                style={{ animationDelay: '50ms' }}
              >
                <div className="h-9 w-9 rounded-lg bg-black/[0.06] dark:bg-white/[0.06]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-24 rounded bg-black/[0.06] dark:bg-white/[0.06]" />
                  <div className="h-3 w-32 rounded bg-black/[0.04] dark:bg-white/[0.04] hidden sm:block" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <PracticeOptions
            setId={id}
            setData={setData}
            enableSrsModule={setData.srsEnabled}
          />
        )}

        {/* Section 3: Items Management - Item list/grid, add/edit/delete */}
        <MasterItemsManagement
          items={items}
          setItems={setItems}
          setData={setData}
          setSetData={setSetData}
          set_type={setData.set_type}
          userProfile={userProfile}
          onOpenAutoCategorizeModal={() => setShowAutoCategorizeModal(true)}
        />
      </div>
      {/* Mobile floating back button — matches SRS dashboard style */}
      <button
        onClick={() => router.push('/learn/academy/sets')}
        className="lg:hidden fixed bottom-6 left-6 z-[60] flex items-center justify-center w-15 h-15 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/60 hover:bg-gray-100/90 dark:hover:bg-gray-700/70 hover:border-gray-400 dark:hover:border-gray-500 transition-all shadow-lg"
      >
        <TbArrowBackUp className="w-6.5 h-6.5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Auto-categorize modal */}
      <BaseModal
        isOpen={showAutoCategorizeModal}
        onClose={() => {
          setShowAutoCategorizeModal(false);
          setAutoCategorizeResult(null);
        }}
        size="md"
        blur={false}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setShowAutoCategorizeModal(false);
                setAutoCategorizeResult(null);
              }}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              {autoCategorizeResult ? 'Done' : 'Cancel'}
            </button>
            {!autoCategorizeResult && (
              <button
                onClick={handleRunAutoCategorize}
                disabled={isAutoCategorizing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-pink hover:bg-[#c00950] text-white transition-colors disabled:opacity-50"
              >
                {isAutoCategorizing ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Categorizing...
                  </>
                ) : (
                  <>
                    <FiTag className="w-4 h-4" />
                    Run Auto-categorize
                  </>
                )}
              </button>
            )}
          </div>
        }
      >
        {/* Custom header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Auto-categorize Items
          </h3>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-pink/8 dark:bg-brand-pink/10">
            <TbLanguageHiragana className="w-5 h-5 text-brand-pink flex-shrink-0" />
            <p className="text-sm font-medium text-brand-pink">
              Categories are required for the Conjugation Practice feature
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Labels each item as a verb, adjective, noun, etc. so conjugation
            practice knows which words to include and how to generate questions.
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-brand-pink mt-0.5">&#x2022;</span>
              Items with kanji are categorized more accurately
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-pink mt-0.5">&#x2022;</span>
              Miscategorized items can be corrected during practice
            </li>
          </ul>
          {autoCategorizeResult && (
            <div
              className={`text-sm px-3 py-2 rounded-lg ${
                autoCategorizeResult.startsWith('Error')
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              }`}
            >
              {autoCategorizeResult}
            </div>
          )}
        </div>
      </BaseModal>
    </AuthenticatedLayout>
  );
}

// ============================================================================
// SERVER-SIDE AUTHENTICATION
// ============================================================================

// Protect this page - requires authentication via Auth0
export const getServerSideProps = withPageAuthRequired();
