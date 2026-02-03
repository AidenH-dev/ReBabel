import Head from "next/head";
import AcademySidebar from "../../../components/Sidebars/AcademySidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
    FaBook,
    FaGraduationCap,
    FaChartLine,
    FaClock,
    FaPlus,
    FaBookOpen,
    FaArrowRight,
    FaBrain,
    FaLayerGroup,
    FaInfoCircle,
    FaTimes,
    FaLock,
    FaRocket,
    FaClipboardList
} from "react-icons/fa";
import {
    FaListCheck
} from "react-icons/fa6";
import { TbStack2, TbCards } from "react-icons/tb";
import { MdConstruction } from "react-icons/md";
import { LuAlarmClockCheck } from "react-icons/lu";
import { TbBolt } from "react-icons/tb";

export default function AcademyHome() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [isQuickStudyLoading, setIsQuickStudyLoading] = useState(false);

    // Fetch user profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await fetch("/api/auth/me");
                const profile = await response.json();
                setUserProfile(profile);
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserProfile();
    }, []);

    const handleCreateSet = () => {
        router.push('/learn/academy/sets/create');
    };

    const handleQuickStudy = async () => {
        if (!userProfile?.sub) {
            alert("Unable to load user profile. Please refresh the page.");
            return;
        }

        setIsQuickStudyLoading(true);

        try {
            // Fetch user's sets from the API using the correct endpoint
            const response = await fetch(
                `/api/database/v2/sets/retrieve-list/${encodeURIComponent(userProfile.sub)}`
            );
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const result = await response.json();

            // Check if the request was successful and sets exist
            if (!result.success || !result.data?.sets || result.data.sets.length === 0) {
                alert("You don't have any study sets yet. Create one to get started!");
                router.push('/learn/academy/sets/create');
                return;
            }

            // Randomly select a set from the list
            const randomIndex = Math.floor(Math.random() * result.data.sets.length);
            const randomSet = result.data.sets[randomIndex];

            // Redirect to the quiz page for the selected set using entity_id
            router.push(`/learn/academy/sets/study/${randomSet.entity_id}/quiz`);
        } catch (error) {
            console.error("Error during quick study:", error);
            alert("Failed to load study sets. Please try again.");
        } finally {
            setIsQuickStudyLoading(false);
        }
    };

    const InfoModal = () => {
        if (!showInfoModal) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Study Sets vs Learning Materials: What&apos;s the Difference?
                            </h2>
                            <button
                                onClick={() => setShowInfoModal(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Sets Section */}
                            <div className="border-l-4 border-blue-500 pl-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TbCards className="text-blue-500 text-xl" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Study Sets</h3>
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">Available Now</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    Basic study groups that can be reviewed in notecard or quiz format. Perfect for memorization and quick review sessions.
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Examples:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <li>Fruits and vegetables vocabulary</li>
                                        <li>Chapter 1 grammar points</li>
                                        <li>Hiragana characters</li>
                                        <li>Common phrases</li>
                                        <li>Verb conjugations</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Learning Materials Section */}
                            <div className="border-l-4 border-purple-500 pl-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <FaBook className="text-purple-500 text-xl" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Materials</h3>
                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full font-medium">Coming Soon</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mb-3">
                                    Complete course structures with dynamic and adaptive learning engagement. Track progress through comprehensive textbooks and structured curricula.
                                </p>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Examples:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <li>Genki 1 Textbook (full course)</li>
                                        <li>Minna no Nihongo (complete series)</li>
                                        <li>University Japanese Course</li>
                                        <li>JLPT N5-N1 Preparation Materials</li>
                                        <li>Custom institutional curricula</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    <strong>💡 Pro tip:</strong> Start with Sets for quick memorization tasks while we&apos;re building the full Learning Materials system!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
            <AcademySidebar />

            <main className="ml-auto max-h-screen overflow-scroll flex-1 px-8 py-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
                <Head>
                    <title>Academy • ReBabel</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                {/* Header Section */}
                <div className="mb-3">
                    <div className="mb-2">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                            Academy
                        </h1>
                    </div>


                    {/* Coming Soon Stats
                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg p-4 mb-6 border border-orange-200 dark:border-orange-800 text-sm">
                        <div className="flex items-start gap-3">
                            <MdConstruction className="text-orange-500 text-lg mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1.5">
                                    Metrics & Analytics Coming Soon!
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    We&apos;re building a comprehensive tracking system to monitor your study hours, completion rates, and learning progress. These features will be available in the next update.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                                    {[
                                        { label: "Study Hours", icon: FaClock },
                                        { label: "Completed", icon: FaListCheck },
                                        { label: "Active Sections", icon: FaLayerGroup },
                                        { label: "Weekly Progress", icon: FaChartLine },
                                        { label: "Achievements", icon: FaGraduationCap }
                                    ].map((stat, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white/50 dark:bg-gray-800/30 rounded-md p-2 opacity-60"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <stat.icon className="text-gray-400 text-xs" />
                                                <span className="text-[10px] text-gray-500 dark:text-gray-500">
                                                    {stat.label}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div> */}

                </div>

                {/* Main Content Grid */}
                <div className="mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Study Sets Section - Available */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Study Sets</h2>
                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">Available</span>
                                    <button
                                        onClick={() => setShowInfoModal(true)}
                                        className="bg-blue-50 dark:text-white dark:bg-blue-900/10 text-xs rounded-lg px-1.5 py-1 border border-blue-200 dark:border-blue-800"
                                    >
                                        Learn More
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Create New Set Card */}
                                <div
                                    onClick={handleCreateSet}
                                    className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#e30a5f] dark:hover:border-[#e30a5f] cursor-pointer transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-[#e30a5f]/10 dark:group-hover:bg-[#e30a5f]/20 transition-colors">
                                            <TbCards className="text-2xl text-gray-400 group-hover:text-[#e30a5f] transition-colors" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white group-hover:text-[#e30a5f] transition-colors">
                                                Create A New Set
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                                Add vocabulary, phrases, or concepts to study
                                            </p>
                                        </div>
                                        <FaPlus className="text-[#e30a5f] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>

                                {/* Browse Existing Sets */}
                                <button
                                    onClick={() => router.push('/learn/academy/sets')}
                                    className="w-full bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6 hover:shadow-md transition-all group text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <TbStack2 className="text-2xl text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">Browse Existing Sets</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                                Review and practice your study materials
                                            </p>
                                        </div>
                                        <FaArrowRight className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>

                                {/* Quick Study */}
                                <button
                                    onClick={handleQuickStudy}
                                    disabled={isQuickStudyLoading}
                                    className="w-full bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6 hover:shadow-md transition-all group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                            <TbBolt className={`text-2xl text-green-600 dark:text-green-400 ${isQuickStudyLoading ? 'animate-pulse' : ''}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {isQuickStudyLoading ? 'Selecting Random Set...' : 'Quick Study Session'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                                {isQuickStudyLoading ? 'Loading your sets...' : 'Jump into a random quiz instantly'}
                                            </p>
                                        </div>
                                        {!isQuickStudyLoading && (
                                            <FaArrowRight className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        )}
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Learning Materials Section - Coming Soon */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Learning Materials</h2>
                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full font-medium">In Development</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Coming Soon Cards */}
                                {[
                                    {
                                        title: "Add Course Materials",
                                        description: "Upload textbooks and structured curricula",
                                        icon: FaBook,
                                        color: "purple"
                                    },
                                    {
                                        title: "Track Progress",
                                        description: "Monitor completion through chapters and sections",
                                        icon: FaClipboardList,
                                        color: "indigo"
                                    },
                                    {
                                        title: "Adaptive Learning",
                                        description: "AI-powered personalized study paths",
                                        icon: FaBrain,
                                        color: "pink"
                                    }
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6 opacity-60 cursor-not-allowed relative overflow-hidden"
                                    >
                                        <div className="absolute top-2 right-2">
                                            <FaLock className="text-gray-400 text-sm" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-lg bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center`}>
                                                <item.icon className={`text-2xl text-${item.color}-600 dark:text-${item.color}-400`} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-500">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-100/50 dark:from-gray-900/50 to-transparent pointer-events-none" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            {/* Info Modal */}
            <InfoModal />
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();