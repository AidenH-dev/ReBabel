import { formatDateTime, formatBrowserType, formatEmail } from '../models/bugReportFormatters';
import { IoOpenOutline } from "react-icons/io5";


export const BugReportRow = ({ report, index, isExpanded, onToggleExpand }) => {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-[#232d3a] transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {formatDateTime(report.properties?.time_submitted)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
        {formatEmail(report.properties?.user_email)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-xs">
          {formatBrowserType(report.properties?.browser_type)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <button
          onClick={() => onToggleExpand(report.entity_id)}
          className="inline-flex items-center gap-1 py-0.5 px-1.5  border-2 border-[#e30a5f] text-[#e30a5f] hover:bg-[#e30a5f]/10 dark:hover:bg-[#e30a5f]/20 rounded-lg transition-colors"        >
          {isExpanded ? 'Close' : 'View'} <IoOpenOutline />
        </button>
      </td>
    </tr>
  );
};
