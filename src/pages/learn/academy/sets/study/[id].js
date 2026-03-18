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

import Head from 'next/head';
import MainSidebar from '@/components/Sidebars/AcademySidebar';
import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// Component imports
import MasterItemsManagement from '@/components/pages/academy/sets/ViewSet/ItemsManagement/MasterItemsManagement';
import PracticeOptions from '@/components/pages/academy/sets/ViewSet/PracticeOptions/MasterPracticeOptions';
import MasterSetHeader from '@/components/pages/academy/sets/ViewSet/SetHeader/MasterSetHeader';
import PageHeader from '@/components/ui/PageHeader';
import { TbStack2, TbRepeat, TbRepeatOff } from 'react-icons/tb';
import { FiEdit2, FiMoreVertical } from 'react-icons/fi';
import { HiOutlineDownload } from 'react-icons/hi';

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

        console.log('Set Result: ', result);

        // Extract data from API response
        const apiData = result.data;
        const setInfo = apiData.data?.set;
        const setItemsAPI = apiData.data?.items || [];
        const metadata = apiData.metadata;

        if (!setInfo) {
          throw new Error('Invalid set data structure received from API');
        }

        //console.log("Set Info from API:", setInfo);
        //console.log("Set Type from API:", setInfo.set_type);

        // Populate set metadata
        setSetData({
          id: apiData.set_id,
          title: setInfo.title || 'Untitled Set',
          description: setInfo.description?.toString() || '',
          owner: setInfo.owner || '',
          dateCreated: setInfo.date_created || '',
          lastStudied: setInfo.last_studied || '',
          srsEnabled: setInfo.srs_enabled === 'true', // Convert string to boolean
          set_type: setInfo.set_type || null, // 'vocab', 'grammar', or null for legacy sets
          tags: Array.isArray(setInfo.tags) ? setInfo.tags : [],
          itemCount: metadata?.total_items || 0,
          studyStats: {
            known: 0,
            learning: 0,
            unknown: 0,
            lastScore: 0,
          },
        });

        console.log('SetData.set_type set to:', setInfo.set_type || null);

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
                    example_sentences: Array.isArray(item.example_sentences)
                      ? item.example_sentences
                      : [item.example_sentences].filter(Boolean),
                    tags: Array.isArray(item.tags) ? item.tags : [],
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
                    example_sentences: Array.isArray(item.example_sentences)
                      ? item.example_sentences.map((ex) =>
                          typeof ex === 'string'
                            ? ex
                            : `${ex.japanese || ''} (${ex.english || ''})`
                        )
                      : [],
                    tags: Array.isArray(item.tags) ? item.tags : [],
                  };
                }
                return null;
              })
              .filter(Boolean)
          : [];

        setItems(transformedItems);
      } catch (err) {
        console.error('Error fetching set:', err);
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
        console.error('Error fetching user profile:', error);
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
      console.error('Error saving title:', err);
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
      <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
        <MainSidebar />
        <main className="ml-auto flex-1 px-4 sm:px-6 py-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 text-lg font-semibold mb-2">
              Error Loading Set
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

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="flex h-screen min-h-0 bg-gray-50 dark:bg-[#141f25]">
      {/* Left sidebar navigation */}
      <MainSidebar />

      {/* Main content area */}
      <main className="ml-auto flex-1 flex flex-col min-h-0 sm:overflow-hidden">
        {/* Page metadata */}
        <Head>
          <title>{setData.title} - View Set</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

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
                      className="col-start-1 row-start-1 text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-b border-[#e30a5f]/50 outline-none m-0 p-0 px-px leading-normal w-full"
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
              <div className="relative" ref={headerOptionsRef}>
                <button
                  onClick={() => setShowHeaderOptions((v) => !v)}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                  title="More"
                >
                  <FiMoreVertical className="w-4.5 h-4.5" />
                </button>
                {showHeaderOptions && (
                  <div className="absolute right-0 dark:text-white mt-1 w-56 bg-white dark:bg-[#1c2b35] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                    <button
                      onClick={() => {
                        headerActionsRef.current?.openEdit?.();
                        setShowHeaderOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#1d2a32] flex items-center gap-2"
                    >
                      <FiEdit2 className="inline w-4 h-4" />
                      Edit Set Details
                    </button>
                    <button
                      onClick={() => {
                        headerActionsRef.current?.exportCSV?.();
                        setShowHeaderOptions(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#1d2a32] flex items-center gap-2"
                    >
                      <HiOutlineDownload className="inline w-4 h-4" />
                      Export Set (CSV)
                    </button>
                  </div>
                )}
              </div>
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
          <PracticeOptions
            setId={id}
            setData={setData}
            enableSrsModule={setData.srsEnabled}
          />

          {/* Section 3: Items Management - Item list/grid, add/edit/delete */}
          <MasterItemsManagement
            items={items}
            setItems={setItems}
            setData={setData}
            set_type={setData.set_type}
            userProfile={userProfile}
          />
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// SERVER-SIDE AUTHENTICATION
// ============================================================================

// Protect this page - requires authentication via Auth0
export const getServerSideProps = withPageAuthRequired();
