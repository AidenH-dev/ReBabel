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
import MasterSrsSetModule from "@/components/pages/academy/sets/ViewSet/srsSetModule/MasterSrsSetModule";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function ViewSetPage() {
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
        if (!response.ok) throw new Error("Failed to fetch user profile");
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

  const handleSetDataUpdate = (updates) => {
    setSetData(prev => ({ ...prev, ...updates }));
  };

  const handleDeleteSet = () => {
    router.push('/learn/academy/sets');
  };

  // ============================================================================
  // RENDER LOGIC
  // ============================================================================

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full"><p>Loading set...</p></div>;
    }
    if (error) {
      return <div className="p-8 text-red-500"><strong>Error:</strong> {error}</div>;
    }
    return (
      <>
        <MasterSetHeader 
          setData={setData} 
          onUpdate={handleSetDataUpdate} 
          onDelete={handleDeleteSet}
          userProfile={userProfile}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
          <div className="lg:col-span-2">
            <PracticeOptions setId={id} />
          </div>
          <div>
            <MasterSrsSetModule stats={setData.studyStats} />
          </div>
        </div>
        <MasterItemsManagement 
          items={items} 
          setItems={setItems} 
          setId={id} 
        />
      </>
    );
  };
  
  return (
    <>
      <Head>
        <title>{setData.title ? `${setData.title} - Study Set` : "Study Set"}</title>
        <meta name="description" content={`Study the set: ${setData.title}`} />
      </Head>
      
      {/* 
        Main Page Container: Implements responsive layout.
        - On mobile (default): `flex-col` stacks the sidebar on top of the content.
        - On large screens (lg): `flex-row` places the sidebar next to the content.
      */}
      <div className="flex flex-col lg:flex-row h-screen min-h-0 bg-gray-50 dark:bg-[#141f25] text-gray-800 dark:text-gray-200">
        <MainSidebar />
        
        {/* 
          Main Content Area:
          - `flex-grow`: Allows this area to fill the remaining space.
          - `overflow-y-auto`: Adds a scrollbar only to this area if content overflows, preventing the whole page from scrolling.
          - `p-4 md:p-6 lg:p-8`: Provides responsive padding.
        */}
        <main className="flex-grow w-full overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

// Applying page-level authentication guard via getServerSideProps
export const getServerSideProps = withPageAuthRequired();

export default ViewSetPage;