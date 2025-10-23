import { FaPlay, FaArrowRight, FaPlus } from 'react-icons/fa';
import { LuRepeat } from "react-icons/lu";
import { MdDashboard } from 'react-icons/md';
import { PiClockClockwiseBold } from 'react-icons/pi';

export default function SRSDashboard() {
    const stats = {
        dueNow: 28,
        learnNew: 5,
        totalSRItems: 245
    };

    const handleDueNowClick = () => {
        console.log('Starting due cards review...');
        // Add navigation logic here
    };

    const handleLearnNewClick = () => {
        console.log('Starting new cards learning...');
        // Add navigation logic here
    };

    const handleDashboardClick = () => {
        console.log('Opening SRS Dashboard...');
        // Open in new window or navigate
        window.open('/srs/dashboard', '_blank');
    };

    return (
        <div
            className="mb-3 w-full h-full group relative p-3  bg-white dark:bg-[#1c2b35] rounded-lg border border-black/5 dark:border-white/10 transition-all cursor-pointer shadow-sm flex flex-col"
        >
            <div className="flex items-center gap-2 text-xl text-gray-900 dark:text-white font-semibold mb-4">
                <PiClockClockwiseBold />
                <span>Spaced Repition</span>
            </div>
            <div className="flex gap-3 flex-1">
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 sm:w-1/2">
                    {/* Due Now */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDueNowClick();
                        }}
                        className="flex flex-col items-start justify-center gap-0.5 px-4 py-2 bg-gradient-to-r from-[#e30a5f] to-[#c1084d] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5 will-change-transform"
                    >
                        <div className="font-medium text-sm">Due Now</div>
                        <div className="text-2xl font-bold flex items-center">{stats.dueNow}<LuRepeat className="ml-1.5 text-2xl opacity-70 transform-none" /></div>
                    </button>

                    {/* Learn New */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleLearnNewClick();
                        }}
                        className="flex flex-col items-start justify-center gap-0.5 px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] rounded-lg text-white hover:shadow-lg transition-all hover:-translate-y-0.5 will-change-transform"
                    >
                        <div className="font-medium text-sm">Learn New</div>
                        <div className="text-2xl font-bold flex items-center">{stats.learnNew}<FaPlus className="ml-1.5 text-xl opacity-70 transform-none" /></div>
                    </button>
                </div>

                {/* Open Dashboard Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDashboardClick();
                    }}
                    className="flex-1 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border-2 border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400 hover:shadow-md transition-all hover:-translate-y-0.5 min-w-0 will-change-transform"
                >
                    <MdDashboard className="w-8 h-8 text-gray-700 dark:text-gray-200 flex-shrink-0" />
                    <div className="flex-1 text-left min-w-0">
                        <div className="text-md hidden sm:block text-gray-900 dark:text-white font-semibold">
                            Open Dashboard
                        </div>

                    </div>
                    <FaArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-300 flex-shrink-0" />
                </button>
            </div>
        </div>
    );
}