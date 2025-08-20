import Head from "next/head";
import Sidebar from "../../components/Sidebar";
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
    FaStar
} from "react-icons/fa";
import {
    FaArrowTrendUp,
    FaListCheck
} from "react-icons/fa6";
import { MdTranslate } from "react-icons/md";
import { TbCards } from "react-icons/tb";
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
    const [userSets, setUserSets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Language Progress State - This would come from your backend
    const [languageProgress, setLanguageProgress] = useState({
        totalLessons: 23, // Genki 1 & 2
        completedLessons: 5,
        currentLesson: 6,
        totalVocabulary: 2300,
        learnedVocabulary: 312,
        totalGrammarPoints: 180,
        masteredGrammarPoints: 45,
        totalKanji: 317,
        learnedKanji: 78,
        overallProgress: 22, // percentage
        currentLevel: "N5",
        nextLevel: "N4",
        levelProgress: 65
    });

    // Stats state
    const [stats, setStats] = useState({
        streak: 7,
        totalMinutes: 243,
        wordsLearned: 156,
        lessonsCompleted: 12,
        accuracy: 85,
        weeklyGoalProgress: 70,
        totalSessions: 24,
        averageSessionTime: 23
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
            }
        };
        fetchUserProfile();
    }, []);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!userProfile?.email) return;

            setIsLoading(true);
            try {
                const response = await fetch(
                    `/api/database/fetch-user-set?userEmail=${encodeURIComponent(userProfile.email)}`
                );
                const data = await response.json();
                setUserSets(data.slice(0, 3));
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [userProfile]);

    // Overall Progress Chart
    const overallProgressData = {
        labels: ['Completed', 'Remaining'],
        datasets: [
            {
                data: [languageProgress.overallProgress, 100 - languageProgress.overallProgress],
                backgroundColor: ['#e30a5f', '#e5e7eb'],
                borderWidth: 0,
            },
        ],
    };

    const overallProgressOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '85%',
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
    };

    // Skill breakdown data
    const skillBreakdownData = {
        labels: ['Vocabulary', 'Grammar', 'Kanji', 'Listening', 'Speaking'],
        datasets: [
            {
                label: 'Progress',
                data: [
                    Math.round((languageProgress.learnedVocabulary / languageProgress.totalVocabulary) * 100),
                    Math.round((languageProgress.masteredGrammarPoints / languageProgress.totalGrammarPoints) * 100),
                    Math.round((languageProgress.learnedKanji / languageProgress.totalKanji) * 100),
                    35, // Mock data
                    28  // Mock data
                ],
                backgroundColor: '#e30a5f',
                borderColor: '#e30a5f',
                borderWidth: 2,
            },
        ],
    };

    // Lesson roadmap data
    const lessonRoadmap = [
        { id: 1, title: "Greetings & Numbers", status: "completed", vocabulary: 35, grammar: 5 },
        { id: 2, title: "Time & Daily Activities", status: "completed", vocabulary: 42, grammar: 6 },
        { id: 3, title: "Shopping & Money", status: "completed", vocabulary: 38, grammar: 5 },
        { id: 4, title: "Locations & Directions", status: "completed", vocabulary: 45, grammar: 7 },
        { id: 5, title: "Family & Descriptions", status: "completed", vocabulary: 40, grammar: 6 },
        { id: 6, title: "Te-form & Requests", status: "current", vocabulary: 48, grammar: 8, progress: 45 },
        { id: 7, title: "Past Tense & Experiences", status: "locked", vocabulary: 52, grammar: 7 },
        { id: 8, title: "Short Forms & Casual Speech", status: "locked", vocabulary: 46, grammar: 9 },
        // ... more lessons
    ];

    const quickActions = [
        {
            title: "Continue Lesson 6",
            subtitle: "Te-form & Requests",
            icon: <FaBook className="text-2xl" />,
            color: "from-[#e30a5f] to-[#f41567]",
            action: () => router.push("/learn/grammar/translateAdapt?lessons=6"),
            progress: 45
        },
        {
            title: "Review Vocabulary",
            subtitle: "48 words to review",
            icon: <TbCards className="text-2xl" />,
            color: "from-[#3b82f6] to-[#60a5fa]",
            action: () => router.push("/learn/vocabulary/notecards?lesson=6"),
        },
        {
            title: "Practice Grammar",
            subtitle: "Te-form conjugation",
            icon: <FaPencilAlt className="text-2xl" />,
            color: "from-[#10b981] to-[#34d399]",
            action: () => router.push("/learn/grammar/conjugation"),
        },
    ];

    const getStatusIcon = (status) => {
        if (status === 'completed') return <FaCheckCircle className="text-green-500" />;
        if (status === 'current') return <div className="w-3 h-3 bg-[#e30a5f] rounded-full animate-pulse" />;
        return <FaLock className="text-gray-400" />;
    };

    const getStatusColor = (status) => {
        if (status === 'completed') return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
        if (status === 'current') return 'bg-[#e30a5f]/10 dark:bg-[#e30a5f]/20 border-[#e30a5f] dark:border-[#e30a5f]';
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700';
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
            <Sidebar />

            <main className="ml-auto max-h-screen overflow-scroll flex-1 px-8 py-6">
                <Head>
                    <title>Home • ReBabel</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>

                {/* User Profile Header with Progress */}
                <div className="mb-8">
                    <div className="bg-white dark:bg-[#1c2b35] rounded-xl shadow-sm p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e30a5f] to-[#f41567] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                    {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        PAGE COMING SOON Welcome back, {userProfile?.name || 'Learner'}!
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Level: {languageProgress.currentLevel} → {languageProgress.nextLevel}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-lg">
                                <FaFire className="text-orange-500 text-xl" />
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Streak</p>
                                    <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.streak} days</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Progress Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Overall Progress Circle */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="relative w-48 h-48">
                                    <Doughnut data={overallProgressData} options={overallProgressOptions} />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-bold text-gray-900 dark:text-white">
                                            {languageProgress.overallProgress}%
                                        </span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Complete</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                    Overall Japanese Progress
                                </p>
                            </div>

                            {/* Progress Breakdown */}
                            <div className="lg:col-span-2 space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Learning Journey</h3>

                                {/* Lesson Progress */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lessons</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {languageProgress.completedLessons}/{languageProgress.totalLessons} completed
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-gradient-to-r from-[#e30a5f] to-[#f41567] h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${(languageProgress.completedLessons / languageProgress.totalLessons) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Vocabulary Progress */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Vocabulary</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {languageProgress.learnedVocabulary}/{languageProgress.totalVocabulary} words
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${(languageProgress.learnedVocabulary / languageProgress.totalVocabulary) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Grammar Progress */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Grammar Points</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {languageProgress.masteredGrammarPoints}/{languageProgress.totalGrammarPoints} mastered
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${(languageProgress.masteredGrammarPoints / languageProgress.totalGrammarPoints) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Kanji Progress */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Kanji</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {languageProgress.learnedKanji}/{languageProgress.totalKanji} characters
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${(languageProgress.learnedKanji / languageProgress.totalKanji) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Focus & Quick Actions */}
                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Continue Learning</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {quickActions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.action}
                                className="group relative overflow-hidden rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg bg-white dark:bg-[#1c2b35] border border-gray-200 dark:border-gray-700"
                            >
                                {action.progress && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#e30a5f] to-[#f41567]"
                                            style={{ width: `${action.progress}%` }}
                                        />
                                    </div>
                                )}
                                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                                <div className="relative z-10">
                                    <div className="mb-2 text-gray-600 dark:text-gray-400">{action.icon}</div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{action.subtitle}</p>
                                </div>
                                <FaArrowRight className="absolute bottom-4 right-4 text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </section>

                {/* Learning Roadmap */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <section className="bg-white dark:bg-[#1c2b35] rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Roadmap</h2>
                                <button className="text-sm text-[#e30a5f] hover:text-[#f41567] font-medium">
                                    View All Lessons →
                                </button>
                            </div>

                            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                {lessonRoadmap.map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className={`relative flex items-center gap-4 p-4 rounded-lg border transition-all ${getStatusColor(lesson.status)
                                            } ${lesson.status !== 'locked' ? 'cursor-pointer hover:shadow-md' : 'opacity-60'}`}
                                        onClick={() => lesson.status !== 'locked' && router.push(`/learn/grammar?lesson=${lesson.id}`)}
                                    >
                                        <div className="flex-shrink-0">
                                            {getStatusIcon(lesson.status)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-medium text-gray-900 dark:text-white">
                                                    Lesson {lesson.id}: {lesson.title}
                                                </h3>
                                                <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                                    <span>{lesson.vocabulary} words</span>
                                                    <span>{lesson.grammar} grammar points</span>
                                                </div>
                                            </div>
                                            {lesson.status === 'current' && lesson.progress && (
                                                <div className="mt-2">
                                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className="bg-[#e30a5f] h-2 rounded-full transition-all duration-500"
                                                            style={{ width: `${lesson.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column - Stats & Achievements */}
                    <div className="space-y-6">
                        {/* Daily Goals */}
                        <section className="bg-white dark:bg-[#1c2b35] rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Today&apos;s Goals</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FaClock className="text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Study 30 minutes</span>
                                    </div>
                                    <FaCheckCircle className="text-green-500" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FaBook className="text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Complete 1 lesson</span>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TbCards className="text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Review 20 cards</span>
                                    </div>
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                                </div>
                            </div>
                        </section>

                        {/* Level Progress */}
                        <section className="bg-gradient-to-br from-[#e30a5f] to-[#f41567] rounded-xl p-6 shadow-sm text-white">
                            <h2 className="text-lg font-semibold mb-4">JLPT Progress</h2>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl font-bold">{languageProgress.currentLevel}</span>
                                <span className="text-sm opacity-90">→</span>
                                <span className="text-2xl font-bold opacity-50">{languageProgress.nextLevel}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-3 mb-2">
                                <div
                                    className="bg-white h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${languageProgress.levelProgress}%` }}
                                />
                            </div>
                            <p className="text-xs opacity-90">
                                {languageProgress.levelProgress}% to {languageProgress.nextLevel} level
                            </p>
                        </section>

                        {/* Recent Achievements */}
                        <section className="bg-white dark:bg-[#1c2b35] rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h2>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { icon: <FaFire />, label: "7 Day Streak", earned: true },
                                    { icon: <FaStar />, label: "First 100 Words", earned: true },
                                    { icon: <FaTrophy />, label: "Grammar Master", earned: false },
                                ].map((achievement, index) => (
                                    <div
                                        key={index}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg ${achievement.earned
                                                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'
                                                : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
                                            }`}
                                    >
                                        <div className="text-2xl mb-1">{achievement.icon}</div>
                                        <span className="text-xs text-center">{achievement.label}</span>
                                    </div>
                                ))}
                            </div>
                            <button className="mt-4 w-full text-center text-sm text-[#e30a5f] hover:text-[#f41567] font-medium">
                                View All Badges →
                            </button>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

export const getServerSideProps = withPageAuthRequired();