export const TIME_RANGE_PRESETS = {
  '24h': { label: 'Last 24 Hours', value: '24h' },
  '7d': { label: 'Last 7 Days', value: '7d' },
  '30d': { label: 'Last 30 Days', value: '30d' },
  '90d': { label: 'Last 90 Days', value: '90d' },
  'custom': { label: 'Custom Range', value: 'custom' }
};

export const SORTABLE_COLUMNS = ['submitted', 'email', 'browser'];

export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

export const DEFAULT_ROWS_PER_PAGE = 10;
export const DEFAULT_SORT_COLUMN = 'submitted';
export const DEFAULT_SORT_DIRECTION = 'desc';
export const DEFAULT_TIME_RANGE = '24h';
