import { useEffect, useState } from 'react';
import { fetchBugReports, calculateDateRange } from '../models/bugReportDataModel';
import { DEFAULT_TIME_RANGE } from '../models/bugReportConstants';

export const useBugReports = () => {
  const [bugReports, setBugReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Time range state
  const [timeRangePreset, setTimeRangePreset] = useState(DEFAULT_TIME_RANGE);
  const [customDateRange, setCustomDateRange] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateRange = calculateDateRange(timeRangePreset, customDateRange);
      const result = await fetchBugReports(dateRange);

      if (result.success) {
        setBugReports(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching bug reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    setCurrentPage(1); // Reset to first page when filter changes
  }, [timeRangePreset, customDateRange]);

  const handleTimeRangeChange = (value) => {
    if (value === 'custom') {
      setTimeRangePreset('custom');
      setCustomDateRange({ startDate: '', endDate: '' });
    } else {
      setCustomDateRange(null);
      setTimeRangePreset(value);
    }
  };

  const handleCustomDateChange = (field, value) => {
    setCustomDateRange(prev => ({
      ...prev || { startDate: '', endDate: '' },
      [field]: value
    }));
  };

  const applyCustomRange = () => {
    if (customDateRange?.startDate && customDateRange?.endDate) {
      setTimeRangePreset('custom');
    }
  };

  return {
    bugReports,
    loading,
    error,
    timeRangePreset,
    customDateRange,
    currentPage,
    rowsPerPage,
    setCurrentPage,
    setRowsPerPage,
    handleTimeRangeChange,
    handleCustomDateChange,
    applyCustomRange
  };
};
