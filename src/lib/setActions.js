import { clientLog } from '@/lib/clientLogger';

export const markSetStudied = async (setId) => {
  try {
    await fetch('/api/database/v2/sets/update-from-full-set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entityType: 'set',
        entityId: setId,
        updates: { last_studied: new Date().toISOString() },
      }),
    });
  } catch (err) {
    clientLog.error('set.mark_studied_failed', {
      setId,
      error: err?.message || String(err),
    });
  }
};
