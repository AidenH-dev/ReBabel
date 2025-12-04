export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Unknown';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'Unknown';
  try {
    return new Date(dateString).toLocaleString();
  } catch (e) {
    console.error('Error formatting datetime:', e);
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
