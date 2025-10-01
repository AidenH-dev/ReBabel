// pages/learn/academy/dashboard.js
import Head from "next/head";
import MainSidebar from "../../components/Sidebars/MainSidebar";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { 
  FaFire, 
  FaClock, 
  FaCheck,
  FaChartLine,
  FaCalendarAlt,
  FaArrowRight
} from 'react-icons/fa';
import { TbCards, TbBolt } from 'react-icons/tb';

function ActivityCalendar({ activityData }) {
  const getColorClass = (level) => {
    if (level === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (level === 1) return 'bg-green-200 dark:bg-green-900/40';
    if (level === 2) return 'bg-green-400 dark:bg-green-700/60';
    if (level === 3) return 'bg-green-600 dark:bg-green-600/80';
    return 'bg-green-700 dark:bg-green-500';
  };

  // Group by week
  const weeks = [];
  for (let i = 0; i < activityData.length; i += 7) {
    weeks.push(activityData.slice(i, i + 7));
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-0.5">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                className={`w-2.5 h-2.5 rounded-sm ${getColorClass(day.level)} transition-all hover:ring-1 hover:ring-[#e30a5f] cursor-pointer`}
                title={`${day.date}: ${day.minutes}min`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [greeting, setGreeting] = useState('Hello');
  const [mounted, setMounted] = useState(false);
  
  // Initialize with static data to avoid hydration issues
  const [userData, setUserData] = useState({
    name: "",
    currentStreak: 7,
    longestStreak: 14,
    totalStudyTime: "12h 34m",
    setsCompleted: 8,
    cardsReviewed: 342,
    accuracyRate: 87,
    activityData: [] // Start empty
  });

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const profile = await response.json();
        setUserProfile(profile);
        if (profile?.name) {
          setUserData(prev => ({ ...prev, name: profile.name }));
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };
    fetchUserProfile();
  }, []);

  // Generate activity data on client side only
  useEffect(() => {
    setMounted(true);
    
    // Set greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    // Generate mock activity data
    const data = [];
    const today = new Date();
    
    for (let i = 59; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Randomly assign study time (0-4 levels)
      const studyLevel = Math.random() > 0.3 ? Math.floor(Math.random() * 4) + 1 : 0;
      
      data.push({
        date: date.toISOString().split('T')[0],
        level: studyLevel,
        minutes: studyLevel * 15
      });
    }
    
    setUserData(prev => ({ ...prev, activityData: data }));
  }, []);

  // Show loading state until client-side hydration is complete
  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
        <MainSidebar />
        
        <main className="ml-auto flex-1 overflow-y-auto">
          <Head>
            <title>Dashboard • ReBabel</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>
          
          <div className="p-4">
            <div className="max-w-5xl mx-auto space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  Hello!
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ready to continue your Japanese learning journey?
                </p>
              </div>

              {/* Compact Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Streak Card */}
                <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white shadow border-2 border-dashed border-orange-300 relative cursor-not-allowed">
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 backdrop-blur-sm border border-orange-600 text-orange-600 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                    Coming Soon
                  </div>
                  
                  <div className="opacity-40 pointer-events-none">
                    <div className="flex items-center justify-between mb-2">
                      <FaFire className="text-2xl" />
                      <div className="text-right">
                        <div className="text-xs opacity-75">Longest</div>
                        <div className="text-lg font-bold">{userData.longestStreak}</div>
                      </div>
                    </div>
                    <div className="text-3xl font-bold mb-0.5">{userData.currentStreak}</div>
                    <p className="text-xs opacity-90">day streak</p>
                  </div>
                </div>

                {/* Study Time */}
                <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 relative cursor-not-allowed">
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                    Coming Soon
                  </div>
                  
                  <div className="opacity-40 pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <FaClock className="text-sm text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                      {userData.totalStudyTime}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Study Time</p>
                  </div>
                </div>

                {/* Accuracy */}
                <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 relative cursor-not-allowed">
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                    Coming Soon
                  </div>
                  
                  <div className="opacity-40 pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <FaCheck className="text-sm text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                      {userData.accuracyRate}%
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Accuracy Rate</p>
                  </div>
                </div>

                {/* Items Reviewed */}
                <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 relative cursor-not-allowed">
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                    Coming Soon
                  </div>
                  
                  <div className="opacity-40 pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <TbCards className="text-sm text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                      {userData.cardsReviewed}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Items Reviewed</p>
                  </div>
                </div>
              </div>

              {/* Activity Calendar - Empty state */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 relative cursor-not-allowed">
                <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-xs rounded-lg font-semibold shadow-sm z-10">
                  Coming Soon
                </div>
                
                <div className="opacity-40 pointer-events-none">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-600 dark:text-gray-400 text-sm" />
                      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Activity
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                      <span>Less</span>
                      <div className="flex gap-0.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-gray-100 dark:bg-gray-800" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-200 dark:bg-green-900/40" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-400 dark:bg-green-700/60" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-600 dark:bg-green-600/80" />
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-700 dark:bg-green-500" />
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                  
                  <div className="h-16 flex items-center justify-center text-gray-400 dark:text-gray-600">
                    Loading...
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button 
                  onClick={() => router.push('/learn/academy/sets')}
                  className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <TbCards className="text-lg text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Study Sets</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">Review materials</p>
                    </div>
                    <FaArrowRight className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                </button>

                <button 
                  disabled
                  className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 text-left cursor-not-allowed relative"
                >
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                    Coming Soon
                  </div>
                  
                  <div className="opacity-40 pointer-events-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <TbBolt className="text-lg text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Quick Review</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">15 min session</p>
                      </div>
                    </div>
                  </div>
                </button>

                <button 
                  disabled
                  className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 text-left cursor-not-allowed relative"
                >
                  <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                    Coming Soon
                  </div>
                  
                  <div className="opacity-40 pointer-events-none">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                        <FaChartLine className="text-lg text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Progress</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">View stats</p>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#141f25]">
      <MainSidebar />
      
      <main className="ml-auto flex-1 overflow-y-auto">
        <Head>
          <title>Dashboard • ReBabel</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <div className="p-4">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {greeting}{userData.name ? `, ${userData.name}` : ''}!
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ready to continue your Japanese learning journey?
              </p>
            </div>

            {/* Compact Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Streak Card */}
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-4 text-white shadow border-2 border-dashed border-orange-300 relative cursor-not-allowed">
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 backdrop-blur-sm border border-orange-600 text-orange-600 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                  Coming Soon
                </div>
                
                <div className="opacity-40 pointer-events-none">
                  <div className="flex items-center justify-between mb-2">
                    <FaFire className="text-2xl" />
                    <div className="text-right">
                      <div className="text-xs opacity-75">Longest</div>
                      <div className="text-lg font-bold">{userData.longestStreak}</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold mb-0.5">{userData.currentStreak}</div>
                  <p className="text-xs opacity-90">day streak</p>
                </div>
              </div>

              {/* Study Time */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 relative cursor-not-allowed">
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                  Coming Soon
                </div>
                
                <div className="opacity-40 pointer-events-none">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <FaClock className="text-sm text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {userData.totalStudyTime}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total Study Time</p>
                </div>
              </div>

              {/* Accuracy */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 relative cursor-not-allowed">
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                  Coming Soon
                </div>
                
                <div className="opacity-40 pointer-events-none">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <FaCheck className="text-sm text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {userData.accuracyRate}%
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Accuracy Rate</p>
                </div>
              </div>

              {/* Items Reviewed */}
              <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 relative cursor-not-allowed">
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                  Coming Soon
                </div>
                
                <div className="opacity-40 pointer-events-none">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <TbCards className="text-sm text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                    {userData.cardsReviewed}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Items Reviewed</p>
                </div>
              </div>
            </div>

            {/* Activity Calendar */}
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 relative cursor-not-allowed">
              <div className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-xs rounded-lg font-semibold shadow-sm z-10">
                Coming Soon
              </div>
              
              <div className="opacity-40 pointer-events-none">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-600 dark:text-gray-400 text-sm" />
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Activity
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                    <span>Less</span>
                    <div className="flex gap-0.5">
                      <div className="w-2.5 h-2.5 rounded-sm bg-gray-100 dark:bg-gray-800" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-green-200 dark:bg-green-900/40" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-green-400 dark:bg-green-700/60" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-green-600 dark:bg-green-600/80" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-green-700 dark:bg-green-500" />
                    </div>
                    <span>More</span>
                  </div>
                </div>
                
                {userData.activityData.length > 0 && (
                  <>
                    <ActivityCalendar activityData={userData.activityData} />
                    
                    <div className="mt-3 grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {userData.activityData.filter(d => d.level > 0).length}
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">Days Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {userData.setsCompleted}
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">Sets Done</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {userData.cardsReviewed}
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">Cards</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {Math.round(userData.activityData.reduce((sum, d) => sum + d.minutes, 0) / 60)}h
                        </div>
                        <div className="text-[10px] text-gray-600 dark:text-gray-400">60 Days</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button 
                onClick={() => router.push('/learn/academy/sets')}
                className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <TbCards className="text-lg text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Study Sets</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">Review materials</p>
                  </div>
                  <FaArrowRight className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </button>

              <button 
                disabled
                className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 text-left cursor-not-allowed relative"
              >
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                  Coming Soon
                </div>
                
                <div className="opacity-40 pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <TbBolt className="text-lg text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Quick Review</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">15 min session</p>
                    </div>
                  </div>
                </div>
              </button>

              <button 
                disabled
                className="bg-white dark:bg-[#1c2b35] rounded-lg p-4 shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 text-left cursor-not-allowed relative"
              >
                <div className="absolute top-2 right-2 px-2.5 py-1 bg-white/90 dark:bg-[#1c2b35]/90 backdrop-blur-sm border border-orange-500 text-orange-600 dark:text-orange-400 text-[10px] rounded-lg font-semibold shadow-sm z-10">
                  Coming Soon
                </div>
                
                <div className="opacity-40 pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <FaChartLine className="text-lg text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Progress</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">View stats</p>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps = withPageAuthRequired();