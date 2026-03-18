import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from 'react';

const PREF_KEYS = {
  theme: { localKey: 'theme', default: 'system' },
  sets_view: { localKey: 'sets-view', default: 'grid' },
  sets_sort: { localKey: 'sets-sort', default: 'recent' },
  sets_size_desc: { localKey: 'sets-size-desc', default: 'true' },
};

const PreferencesContext = createContext();

export function PreferencesProvider({ children }) {
  const hasSynced = useRef(false);
  const [preferences, setPreferences] = useState(null); // null = not loaded yet
  const listeners = useRef(new Set());

  // Subscribe to preference changes
  const subscribe = useCallback((callback) => {
    listeners.current.add(callback);
    return () => listeners.current.delete(callback);
  }, []);

  // Notify all subscribers when prefs load from server
  const notifyListeners = useCallback((prefs) => {
    listeners.current.forEach((cb) => cb(prefs));
  }, []);

  // Fetch once on mount
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
          setPreferences(serverPrefs);
          notifyListeners(serverPrefs);
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
            }).catch(() => {});
          }
          setPreferences(localPrefs);
          notifyListeners(localPrefs);
        }
      } catch {
        // Offline — localStorage is the fallback
        setPreferences({});
      }
    };

    sync();
  }, [notifyListeners]);

  const savePreference = useCallback((prefKey, value) => {
    const config = PREF_KEYS[prefKey];
    if (!config) return;

    localStorage.setItem(config.localKey, value);

    setPreferences((prev) => ({ ...prev, [prefKey]: value }));

    fetch('/api/database/v2/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { [prefKey]: value } }),
    }).catch(() => {});
  }, []);

  return (
    <PreferencesContext.Provider
      value={{ preferences, savePreference, subscribe }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * Access the global preferences context.
 * @param {Function} [onPrefsLoaded] - called once when server prefs are loaded
 * @returns {{ preferences, savePreference, isLoaded }}
 */
export function useUserPreferences(onPrefsLoaded) {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error(
      'useUserPreferences must be used within a PreferencesProvider'
    );
  }

  const { preferences, savePreference, subscribe } = context;
  const calledRef = useRef(false);

  useEffect(() => {
    if (!onPrefsLoaded) return;

    // If prefs already loaded, call immediately
    if (preferences && !calledRef.current) {
      calledRef.current = true;
      onPrefsLoaded(preferences);
      return;
    }

    // Otherwise subscribe for when they arrive
    const unsub = subscribe((prefs) => {
      if (!calledRef.current) {
        calledRef.current = true;
        onPrefsLoaded(prefs);
      }
    });

    return unsub;
  }, [preferences, onPrefsLoaded, subscribe]);

  return { preferences, savePreference, isLoaded: preferences !== null };
}
