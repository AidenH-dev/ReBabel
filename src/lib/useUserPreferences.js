import { useEffect, useRef, useCallback } from 'react';

const PREF_KEYS = {
  theme: { localKey: 'theme', default: 'system' },
  sets_view: { localKey: 'sets-view', default: 'grid' },
  sets_sort: { localKey: 'sets-sort', default: 'recent' },
  sets_size_desc: { localKey: 'sets-size-desc', default: 'true' },
};

/**
 * Syncs user preferences between localStorage and the server.
 * - On mount: fetches server prefs. If empty, pushes localStorage up (one-time migration).
 * - On subsequent loads: server values overwrite localStorage.
 * - savePreference() writes to both localStorage and server.
 *
 * @param {Function} [onPrefsLoaded] - callback with merged prefs object after sync
 * @returns {{ savePreference, isLoaded }}
 */
export function useUserPreferences(onPrefsLoaded) {
  const hasSynced = useRef(false);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;

    const sync = async () => {
      try {
        const res = await fetch('/api/database/v2/user/preferences');
        if (!res.ok) return;

        const result = await res.json();
        if (!result.success) return;

        const serverPrefs = result.data || {};
        const hasServerPrefs = Object.keys(serverPrefs).length > 0;

        if (hasServerPrefs) {
          // Server has prefs — apply them to localStorage
          for (const [prefKey, config] of Object.entries(PREF_KEYS)) {
            if (serverPrefs[prefKey] !== undefined) {
              localStorage.setItem(config.localKey, serverPrefs[prefKey]);
            }
          }
          isLoaded.current = true;
          onPrefsLoaded?.(serverPrefs);
        } else {
          // No server prefs — push localStorage values up (one-time migration)
          const localPrefs = {};
          for (const [prefKey, config] of Object.entries(PREF_KEYS)) {
            const val = localStorage.getItem(config.localKey);
            if (val !== null) localPrefs[prefKey] = val;
          }

          if (Object.keys(localPrefs).length > 0) {
            fetch('/api/database/v2/user/preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ preferences: localPrefs }),
            }).catch(() => {}); // fire and forget
          }
          isLoaded.current = true;
          onPrefsLoaded?.(localPrefs);
        }
      } catch {
        // Offline or error — localStorage is the fallback, no action needed
        isLoaded.current = true;
      }
    };

    sync();
  }, []);

  const savePreference = useCallback((prefKey, value) => {
    const config = PREF_KEYS[prefKey];
    if (!config) return;

    // Always write to localStorage immediately
    localStorage.setItem(config.localKey, value);

    // Write to server in background
    fetch('/api/database/v2/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { [prefKey]: value } }),
    }).catch(() => {}); // fire and forget
  }, []);

  return { savePreference, isLoaded: isLoaded.current };
}
