import { clientLog } from '@/lib/clientLogger';

export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    clientLog.error('bug_report.format_date_failed', {
      error: e?.message || String(e),
    });
    return 'Unknown';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    clientLog.error('bug_report.format_datetime_failed', {
      error: e?.message || String(e),
    });
    return 'Unknown';
  }
};

export const formatBrowserType = (browserType) => {
  if (!browserType) return 'Unknown';
  return browserType.substring(0, 20);
};

export const formatEmail = (email) => {
  return email || 'N/A';
};
