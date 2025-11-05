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

import Head from "next/head";
import MainSidebar from "@/components/Sidebars/AcademySidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

// Component imports
import MasterItemsManagement from "@/components/pages/academy/sets/ViewSet/ItemsManagement/MasterItemsManagement";
import PracticeOptions from "@/components/pages/academy/sets/ViewSet/PracticeOptions/MasterPracticeOptions";
import MasterSetHeader from "@/components/pages/academy/sets/ViewSet/SetHeader/MasterSetHeader";

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

  // User authentication data
  const [userProfile, setUserProfile] = useState(null);

  // Set metadata and configuration
  const [setData, setSetData] = useState({
    id: id,
    title: "",
    description: "",
    owner: "",
    dateCreated: "",
    lastStudied: "",
    srsEnabled: false, // SRS status from database
    tags: [],
    itemCount: 0,
    studyStats: {
      known: 0,
      learning: 0,
      unknown: 0,
      lastScore: 0
    }
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
        const response = await fetch(`/api/database/v2/sets/retrieve-set/${id}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch set: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load set data');
        }

        console.log("Set Result: ", result);

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
          title: setInfo.title || "Untitled Set",
          description: setInfo.description?.toString() || "",
          owner: setInfo.owner || "",
          dateCreated: setInfo.date_created || "",
          lastStudied: setInfo.last_studied || "",
          srsEnabled: setInfo.srs_enabled === 'true', // Convert string to boolean
          tags: Array.isArray(setInfo.tags) ? setInfo.tags : [],
          itemCount: metadata?.total_items || 0,
          studyStats: {
            known: 0,
            learning: 0,
            unknown: 0,
            lastScore: 0
          }
        });

        // Transform API items into consistent format for UI
        const transformedItems = Array.isArray(setItemsAPI) ? setItemsAPI.map((item, index) => {
          // Handle vocabulary items
          if (item.type === 'vocab' || item.type === 'vocabulary') {
            return {
              id: item.id || `temp-vocab-${index}`,
              type: 'vocabulary',
              english: item.english || "",
              kana: item.kana || "",
              kanji: item.kanji || "",
              lexical_category: item.lexical_category || "",
              status: item.known_status || "unknown",
              srs_level: item.srs_level || 0,
              example_sentences: Array.isArray(item.example_sentences)
                ? item.example_sentences
                : [item.example_sentences].filter(Boolean),
              tags: Array.isArray(item.tags) ? item.tags : []
            };
          } 
          // Handle grammar items
          else if (item.type === 'grammar') {
            return {
              id: item.id || `temp-grammar-${index}`,
              type: 'grammar',
              title: item.title || "",
              description: item.description || "",
              topic: item.topic || "",
              status: item.known_status || "unknown",
              srs_level: item.srs_level || 0,
              notes: item.notes || "",
              example_sentences: Array.isArray(item.example_sentences)
                ? item.example_sentences.map(ex =>
                  typeof ex === 'string' ? ex : `${ex.japanese || ''} (${ex.english || ''})`
                )
                : [],
              tags: Array.isArray(item.tags) ? item.tags : []
            };
          }
          return null;
        }).filter(Boolean) : [];

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
        const response = await fetch("/api/auth/me");
        const profile = await response.json();
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
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
    setSetData(prev => {
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
      <main className="ml-auto flex-1 px-4 sm:px-6 py-4 flex flex-col min-h-0 sm:overflow-hidden">
        {/* Page metadata */}
        <Head>
          <title>{setData.title} - View Set</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        {/* Content container with max width */}
        <div className="w-full max-w-6xl mx-auto flex-1 min-h-0 flex flex-col">
          
          {/* Section 1: Set Header - Breadcrumbs, title, edit, export */}
          <MasterSetHeader
            setData={setData}
            items={items}
            onSetDataUpdate={handleSetDataUpdate}
            onDeleteSet={handleDeleteSet}
            srsEnabled={setData.srsEnabled}
          />
          {/* Section 2: Practice Options - Quiz and flashcard buttons */}
          <PracticeOptions setId={id} enableSrsModule={setData.srsEnabled} />

          {/* Section 3: Items Management - Item list/grid, add/edit/delete */}
          <MasterItemsManagement 
            items={items}
            setItems={setItems}
            setData={setData}
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