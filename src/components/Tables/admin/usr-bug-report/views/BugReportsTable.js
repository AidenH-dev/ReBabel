import { FaSpinner, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { BugReportRow } from './BugReportRow';
import { BugReportDetails } from './BugReportDetails';
import { TimeRangeFilter } from './TimeRangeFilter';
import { PaginationControls } from './PaginationControls';
import { ROWS_PER_PAGE_OPTIONS } from '../models/bugReportConstants';

export const BugReportsTable = ({
  bugReports,
  loading,
  error,
  sortColumn,
  sortDirection,
  expandedId,
  currentPage,
  rowsPerPage,
  timeRangePreset,
  customDateRange,
  paginatedReports,
  sortedReports,
  totalPages,
  onSort,
  onToggleExpand,
  onTimeRangeChange,
  onCustomDateChange,
  onApplyCustomRange,
  onPageChange,
  onRowsPerPageChange
}) => {
  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <span className="text-gray-400 ml-1">⇅</span>;
    return sortDirection === 'asc' ? (
      <FaArrowUp className="inline ml-1 text-[#e30a5f]" />
    ) : (
      <FaArrowDown className="inline ml-1 text-[#e30a5f]" />
    );
  };

  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const expandedReport = bugReports.find(r => r.entity_id === expandedId);

  // If a report is expanded, show only the details view
  if (expandedId && expandedReport) {
    return (
      <BugReportDetails
        report={expandedReport}
        onClose={() => onToggleExpand(null)}
      />
    );
  }

  return (
    <div>
      {/* Time Range Filter */}
      <div className="mb-6">
        <TimeRangeFilter
          timeRangePreset={timeRangePreset}
          customDateRange={customDateRange}
          onTimeRangeChange={onTimeRangeChange}
          onCustomDateChange={onCustomDateChange}
          onApplyCustomRange={onApplyCustomRange}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-100 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <FaSpinner className="animate-spin text-2xl text-[#e30a5f]" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Fetching bug reports...</span>
        </div>
      )}

      {/* Reports Table */}
      {!loading && (
        <div>
          {/* Table Stats and Controls */}
          <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing <span className="font-bold text-[#e30a5f]">{startIdx + 1}</span> to{' '}
              <span className="font-bold text-[#e30a5f]">{Math.min(endIdx, sortedReports.length)}</span> of{' '}
              <span className="font-bold text-[#e30a5f]">{sortedReports.length}</span> reports
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  Rows per page:
                  <select
                    value={rowsPerPage}
                    onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
                    className="ml-2 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-[#172229] text-[#4e4a4a] dark:text-white"
                  >
                    {ROWS_PER_PAGE_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {sortedReports.length === 0 ? (
            <div className="bg-white dark:bg-[#1c2b35] rounded-lg p-8 border border-gray-200 dark:border-gray-800 text-center">
              <p className="text-gray-600 dark:text-gray-400">No bug reports found for the selected time range.</p>
            </div>
          ) : (
            /* Table */
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
              <table className="w-full bg-white dark:bg-[#1c2b35]">
                <thead className="bg-gray-50 dark:bg-[#0f1619] border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => onSort('submitted')}
                        className="flex items-center hover:text-[#e30a5f] transition-colors"
                      >
                        Submitted
                        <SortIcon column="submitted" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => onSort('email')}
                        className="flex items-center hover:text-[#e30a5f] transition-colors"
                      >
                        User Email
                        <SortIcon column="email" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <button
                        onClick={() => onSort('browser')}
                        className="flex items-center hover:text-[#e30a5f] transition-colors"
                      >
                        Browser
                        <SortIcon column="browser" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {paginatedReports.map((report, index) => (
                    <BugReportRow
                      key={report.entity_id || index}
                      report={report}
                      index={index}
                      isExpanded={expandedId === report.entity_id}
                      onToggleExpand={onToggleExpand}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {sortedReports.length > 0 && (
            <div className="flex items-center justify-between mt-6 px-2">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                sortedReportsLength={sortedReports.length}
                rowsPerPage={rowsPerPage}
                onPreviousPage={() => onPageChange(Math.max(1, currentPage - 1))}
                onNextPage={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
