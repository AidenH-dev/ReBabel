import React from 'react';
import { TbMessageReport } from 'react-icons/tb';
import { FiAlertTriangle } from "react-icons/fi";


function ReportIssueButton() {
  const handleReportClick = () => {
    // Opens the Google Form in a new browser tab
    window.open('https://forms.gle/avVR1fyjsFFsfoBQA', '_blank');
  };

  return (
    <button
      onClick={handleReportClick}
      // The 'group' class is important so child elements can detect hover via `group-hover:`
      className="
        group
        fixed 
        bottom-4
        right-6 
        z-50 
        flex 
        items-center 
        rounded-full 
        bg-red-600 
        px-3
        py-2
        text-white 
        shadow-lg 
        transition-colors
        duration-200 
        hover:bg-red-500 
        active:outline-none 
        active:ring-2 
        active:ring-red-600 
        active:ring-offset-2
        text-1xl
      "
    >
      {/* Increased icon size to text-2xl */}
      <FiAlertTriangle className="text-3xl mb-1" />
      <span
        className="
          ml-0
          max-w-0
          overflow-hidden
          whitespace-nowrap
          transition-all
          duration-200
          group-hover:ml-2
          group-hover:max-w-xs
          text-1xl
        "
      >
        Report Issue
      </span>
    </button>
  );
}

export default ReportIssueButton;
