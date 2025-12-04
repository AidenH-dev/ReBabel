export const PaginationControls = ({
  currentPage,
  totalPages,
  sortedReportsLength,
  rowsPerPage,
  onPreviousPage,
  onNextPage
}) => {
  if (sortedReportsLength === 0 || totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
      </div>
      <button
        onClick={onPreviousPage}
        disabled={currentPage === 1}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ← Previous
      </button>
      <button
        onClick={onNextPage}
        disabled={currentPage === totalPages}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </div>
  );
};
