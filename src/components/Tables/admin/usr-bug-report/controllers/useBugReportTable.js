import { useState } from 'react';
import { sortBugReports, paginateBugReports } from '../models/bugReportDataModel';
import { DEFAULT_SORT_COLUMN, DEFAULT_SORT_DIRECTION } from '../models/bugReportConstants';

export const useBugReportTable = () => {
  const [sortColumn, setSortColumn] = useState(DEFAULT_SORT_COLUMN);
  const [sortDirection, setSortDirection] = useState(DEFAULT_SORT_DIRECTION);
  const [expandedId, setExpandedId] = useState(null);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const toggleExpanded = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getSortedReports = (reports) => {
    return sortBugReports(reports, sortColumn, sortDirection);
  };

  const getPaginatedReports = (reports, currentPage, rowsPerPage) => {
    const sortedReports = getSortedReports(reports);
    return {
      paginatedReports: paginateBugReports(sortedReports, currentPage, rowsPerPage),
      sortedReports,
      totalPages: Math.ceil(sortedReports.length / rowsPerPage)
    };
  };

  return {
    sortColumn,
    sortDirection,
    expandedId,
    handleSort,
    toggleExpanded,
    getSortedReports,
    getPaginatedReports
  };
};
