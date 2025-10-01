import Head from "next/head";
import MainSidebar from "../../components/Sidebars/MainSidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
    FaBook,
    FaGraduationCap,
    FaChartLine,
    FaClock,
    FaTrophy,
    FaFire,
    FaCalendarAlt,
    FaArrowRight,
    FaLanguage,
    FaPencilAlt,
    FaLock,
    FaCheckCircle,
    FaStar,
    FaUpload,
    FaPlus,
    FaUsers,
    FaBookOpen,
    FaCertificate,
    FaUniversity,
    FaClipboardList,
    FaChevronRight,
    FaEdit,
    FaTrash
} from "react-icons/fa";
import {
    FaArrowTrendUp,
    FaListCheck,
    FaFileLines,
    FaCloudArrowUp
} from "react-icons/fa6";
import { MdTranslate, MdSchool, MdLibraryBooks } from "react-icons/md";
import { TbCards, TbCertificate } from "react-icons/tb";
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';


// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function Home() {
    const router = useRouter();
    const [userProfile, setUserProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('academic'); // 'academic' or 'certificate'
    const [isLoading, setIsLoading] = useState(true);

    // Academic Track State
    const [academicLearning_materials, setAcademicLearning_materials] = useState([]);

    // Certificate Track State
    const [certificateTracks, setCertificateTracks] = useState([
        {
            id: 1,
            name: "JLPT N5",
            level: "Beginner",
            progress: 75,
            totalLessons: 20,
            completedLessons: 15,
            vocabulary: { learned: 500, total: 800 },
            grammar: { learned: 60, total: 80 },
            kanji: { learned: 80, total: 103 },
            targetDate: "July 2025",
            nextTest: "July 6, 2025",
            color: "from-green-500 to-emerald-500"
        },
        {
            id: 2,
            name: "JLPT N4",
            level: "Elementary",
            progress: 25,
            totalLessons: 25,
            completedLessons: 6,
            vocabulary: { learned: 300, total: 1500 },
            grammar: { learned: 35, total: 180 },
            kanji: { learned: 45, total: 300 },
            targetDate: "December 2025",
            nextTest: "December 7, 2025",
            color: "from-blue-500 to-indigo-500"
        },
        {
            id: 3,
            name: "JLPT N3",
            level: "Intermediate",
            progress: 0,
            totalLessons: 30,
            completedLessons: 0,
            vocabulary: { learned: 0, total: 3750 },
            grammar: { learned: 0, total: 350 },
            kanji: { learned: 0, total: 650 },
            locked: true,
            color: "from-purple-500 to-pink-500"
        }
    ]);

    // User stats
    const [stats, setStats] = useState({
        streak: 12,
        totalStudyHours: 47,
        wordsLearned: 856,
        lessonsCompleted: 21,
        accuracy: 87,
        weeklyGoalProgress: 85
    });

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

    useEffect(() => {
        const fetchLearning_materials = async () => {
            try {
                const resp = await fetch('/api/database/v1/learning_materials/list');
                if (!resp.ok) throw new Error('Failed to load learning_materials');
                const { learning_materials } = await resp.json();
                setAcademicLearning_materials(learning_materials || []);
            } catch (err) {
                console.error('Error fetching learning_materials:', err);
                setAcademicLearning_materials([]); // keep UI stable
            }
        };

        // only fetch when userProfile has been loaded (or if you don’t care, call unconditionally)
        if (userProfile !== null) fetchLearning_materials();
    }, [userProfile]);


    const handleUploadMaterials = (learning_materialId) => {
        // Navigate to upload page or open modal
        router.push(`/upload-materials?learning_materialId=${learning_materialId}`);
    };

    
    const handleEditMaterials = (learning_materialId) => {
        // Navigate to upload page or open modal
        router.push(`/learn/learning_material/edit-learning_material/${learning_materialId}`);
    };

    const handleCreateNewLearning_material = () => {
        // Navigate to learning_material creation page
        router.push('/learn/learning_material/create-learning_material');
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
            <MainSidebar />

            <main className="ml-auto max-h-screen overflow-scroll flex-1 px-8 py-6">
                <Head>
                    <title>Learning Dashboard • ReBabel</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                {/* Header with User Info and Stats */}
                <div className="mb-6">
                    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#e30a5f] to-[#f41567] flex items-center justify-center text-white text-xl font-bold">
                                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Welcome back, {userProfile?.name || 'Learner'}!
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Continue your learning journey
                                    </p>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg">
                                    <FaFire className="text-orange-500 text-xl" />
                                    <div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Streak</p>
                                        <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.streak} days</p>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Study Hours</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.totalStudyHours}h</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Words Learned</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.wordsLearned}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-1">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('academic')}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'academic'
                                        ? 'bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <FaUniversity className="text-lg" />
                                <span>Academic Track</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                    {academicLearning_materials.length} Learning Materials
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('certificate')}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === 'certificate'
                                        ? 'bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <TbCertificate className="text-lg" />
                                <span>Certificate Track</span>
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                                    JLPT N5-N1
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Academic Track Content */}
                {activeTab === 'academic' && (
                    <div className="space-y-6">
                        {/* Add New Learning_material Button */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your Learning Materials</h2>
                            <button
                                onClick={handleCreateNewLearning_material}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white rounded-lg hover:shadow-lg transition-all"
                            >
                                <FaPlus />
                                <span>Add New Learning Material</span>
                            </button>
                        </div>

                        {/* Learning_material Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {academicLearning_materials.map((learning_material) => (
                                <div key={learning_material.id} className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm overflow-hidden">
                                    {/* Learning_material Header */}
                                    <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                    {learning_material.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {learning_material.textbook} • {learning_material.institution}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                    onClick={() => handleEditMaterials(learning_material.id)}
                                                >
                                                    
                                                    <FaEdit />
                                                </button>
                                                <button
                                                    onClick={() => handleUploadMaterials(learning_material.id)}
                                                    className="p-2 text-[#e30a5f] hover:text-[#f41567]"
                                                >
                                                    <FaCloudArrowUp />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{learning_material.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-[#e30a5f] to-[#f41567] h-2 rounded-full transition-all"
                                                    style={{ width: `${learning_material.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sections */}
                                    <div className="p-6 space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Current Sections</h4>
                                        {learning_material.sections.map((section) => (
                                            <div
                                                key={section.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all"
                                                onClick={() => router.push(`/learn/section/${section.id}`)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${section.status === 'completed' ? 'bg-green-500' :
                                                            section.status === 'in-progress' ? 'bg-yellow-500' :
                                                                'bg-gray-400'
                                                        }`} />
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {section.title}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {section.completed}/{section.total} subsections
                                                    </span>
                                                    <FaChevronRight className="text-gray-400 text-xs" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Upcoming Deadlines */}
                                    {learning_material.upcomingDeadlines.length > 0 && (
                                        <div className="px-6 pb-6">
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upcoming</h4>
                                            <div className="space-y-2">
                                                {learning_material.upcomingDeadlines.map((deadline, idx) => (
                                                    <div key={idx} className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <FaCalendarAlt className="text-gray-400 text-xs" />
                                                            <span className="text-gray-600 dark:text-gray-400">{deadline.title}</span>
                                                        </div>
                                                        <span className="text-xs font-medium text-[#e30a5f]">{deadline.date}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Actions */}
                                    <div className="px-6 pb-6 flex gap-3">
                                        <button className="flex-1 px-4 py-2 bg-[#e30a5f]/10 text-[#e30a5f] rounded-lg hover:bg-[#e30a5f]/20 transition-all text-sm font-medium">
                                            Continue Learning
                                        </button>
                                        <button className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm font-medium">
                                            Practice Exercises
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Learning_material Card */}
                            <div
                                onClick={handleCreateNewLearning_material}
                                className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#e30a5f] dark:hover:border-[#e30a5f] cursor-pointer transition-all group"
                            >
                                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400 group-hover:text-[#e30a5f] transition-colors">
                                    <FaPlus className="text-4xl mb-3" />
                                    <p className="text-lg font-medium">Add New Learning Material</p>
                                    <p className="text-sm mt-1">Upload your textbook or class materials</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Certificate Track Content */}
                {activeTab === 'certificate' && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">JLPT Certification Paths</h2>

                        {/* Certificate Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {certificateTracks.map((track) => (
                                <div
                                    key={track.id}
                                    className={`bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm overflow-hidden ${track.locked ? 'opacity-60' : ''
                                        }`}
                                >
                                    {/* Header with gradient */}
                                    <div className={`h-2 bg-gradient-to-r ${track.color}`} />

                                    <div className="p-6">
                                        {/* Title and Level */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {track.name}
                                                    {track.locked && <FaLock className="text-gray-400 text-sm" />}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{track.level}</p>
                                            </div>
                                            <TbCertificate className={`text-2xl ${track.locked ? 'text-gray-400' : 'text-[#e30a5f]'
                                                }`} />
                                        </div>

                                        {/* Overall Progress */}
                                        <div className="mb-6">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{track.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                <div
                                                    className={`bg-gradient-to-r ${track.color} h-3 rounded-full transition-all`}
                                                    style={{ width: `${track.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Lessons</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {track.completedLessons}/{track.totalLessons}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Vocabulary</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {track.vocabulary.learned}/{track.vocabulary.total}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Grammar</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {track.grammar.learned}/{track.grammar.total}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Kanji</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {track.kanji.learned}/{track.kanji.total}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Test Date */}
                                        {!track.locked && (
                                            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Next Test Date</p>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{track.nextTest}</p>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        {!track.locked ? (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => router.push(`/learn/jlpt/${track.name.toLowerCase().replace(' ', '-')}`)}
                                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-[#e30a5f] to-[#f41567] text-white rounded-lg hover:shadow-lg transition-all text-sm font-medium"
                                                >
                                                    Continue
                                                </button>
                                                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                                                    <FaChartLine />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                disabled
                                                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-lg cursor-not-allowed text-sm font-medium"
                                            >
                                                Complete Previous Level to Unlock
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Study Resources */}
                        <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Certificate Study Resources</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group">
                                    <TbCards className="text-2xl text-[#e30a5f]" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">Vocabulary Flashcards</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Practice JLPT vocabulary</p>
                                    </div>
                                    <FaArrowRight className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <button className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group">
                                    <FaPencilAlt className="text-2xl text-[#e30a5f]" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">Grammar Drills</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Master JLPT grammar points</p>
                                    </div>
                                    <FaArrowRight className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>

                                <button className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group">
                                    <FaClipboardList className="text-2xl text-[#e30a5f]" />
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 dark:text-white">Practice Tests</p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">Full JLPT mock exams</p>
                                    </div>
                                    <FaArrowRight className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();