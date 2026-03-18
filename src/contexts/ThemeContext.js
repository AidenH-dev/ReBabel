import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useUserPreferences } from '@/contexts/PreferencesContext';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('system');
  const [mounted, setMounted] = useState(false);

  const { savePreference } = useUserPreferences((serverPrefs) => {
    if (serverPrefs.theme) {
      setThemeState(serverPrefs.theme);
    }
  });

  const setTheme = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
      localStorage.setItem('theme', newTheme);
      savePreference('theme', newTheme);
    },
    [savePreference]
  );

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setThemeState(savedTheme);
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.remove('dark', 'dusk', 'cream');

    if (theme === 'system') {
      const systemDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      root.classList.toggle('dark', systemDark);
    } else if (theme === 'dusk') {
      root.classList.add('dark', 'dusk');
    } else if (theme === 'cream') {
      root.classList.add('cream');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    }
  }, [theme, mounted]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (!mounted || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      document.documentElement.classList.remove('dark', 'dusk', 'cream');
      document.documentElement.classList.toggle('dark', e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
