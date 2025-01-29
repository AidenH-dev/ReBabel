import React from 'react';
import { TbMessageReport } from 'react-icons/tb';

function ReportIssueButton({ onClick }) {
    const handleReportClick = () => {
        // Opens the Google Form in a new browser tab
        window.open('https://forms.gle/avVR1fyjsFFsfoBQA', '_blank');
      };
    
      return (
        <button
          onClick={handleReportClick}
          className="
            fixed 
            bottom-6 
            right-6 
            z-50 
            flex 
            items-center 
            gap-2 
            rounded-full 
            bg-red-600 
            px-4 
            py-3 
            text-white 
            shadow-lg 
            transition-colors 
            duration-200 
            hover:bg-red-700 
            active:outline-none 
            active:ring-2 
            active:ring-red-600 
            active:ring-offset-2
          "
        >
          <TbMessageReport className="text-xl" />
          <span className="hidden sm:inline">Report Issue</span>
        </button>
      );
}

export default ReportIssueButton;
