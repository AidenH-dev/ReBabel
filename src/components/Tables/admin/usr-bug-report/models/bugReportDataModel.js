export const parseFormJson = (formJson) => {
  if (!formJson) return {};
  if (typeof formJson === 'string') {
    try {
      return JSON.parse(formJson);
    } catch (e) {
      console.error('Failed to parse form_json:', e);
      return {};
    }
  }
  return formJson;
};

export const calculateDateRange = (preset, customDateRange) => {
  const now = new Date();
  let startDate;

  if (customDateRange?.startDate && customDateRange?.endDate) {
    return customDateRange;
  }

  switch (preset) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
};

export const fetchBugReports = async (dateRange) => {
  try {
    // Use UTC midnight for start of day
    const startTime = new Date(
      dateRange.startDate + 'T00:00:00.000Z'
    ).toISOString();
    // Use UTC end of day (23:59:59.999) to include all reports from that day
    const endTime = new Date(
      dateRange.endDate + 'T23:59:59.999Z'
    ).toISOString();

    const response = await fetch(
      `/api/database/v2/admin/retrieve/bug-report-list?start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch bug reports: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        data: data.data || [],
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to fetch bug reports',
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred',
    };
  }
};

export const sortBugReports = (reports, sortColumn, sortDirection) => {
  const sorted = [...reports].sort((a, b) => {
    let aValue, bValue;

    switch (sortColumn) {
      case 'submitted':
        aValue = new Date(a.properties?.time_submitted || 0).getTime();
        bValue = new Date(b.properties?.time_submitted || 0).getTime();
        break;
      case 'email':
        aValue = (a.properties?.user_email || '').toLowerCase();
        bValue = (b.properties?.user_email || '').toLowerCase();
        break;
      case 'browser':
        aValue = (a.properties?.browser_type || '').toLowerCase();
        bValue = (b.properties?.browser_type || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return sorted;
};

export const paginateBugReports = (reports, currentPage, rowsPerPage) => {
  const startIdx = (currentPage - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  return reports.slice(startIdx, endIdx);
};
