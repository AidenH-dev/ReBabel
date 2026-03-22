import { useTheme } from '@/contexts/ThemeContext';
import { FiMonitor, FiSun, FiMoon } from 'react-icons/fi';
import { TbCoffee, TbSunset2 } from 'react-icons/tb';

const THEMES = [
  { key: 'system', icon: FiMonitor, label: 'System' },
  { key: 'light', icon: FiSun, label: 'Light' },
  { key: 'dark', icon: FiMoon, label: 'Dark' },
  { key: 'cream', icon: TbCoffee, label: 'Cream' },
  { key: 'dusk', icon: TbSunset2, label: 'Dusk' },
];

/**
 * Compact theme toggle for public pages.
 * Shows as a row of small icon buttons. Active theme is highlighted.
 *
 * Usage: <ThemeToggle />
 * Or with label: <ThemeToggle showLabel />
 */
export default function ThemeToggle({ showLabel = false, className = '' }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
          Theme
        </span>
      )}
      {THEMES.map(({ key, icon: Icon, label }) => {
        const isActive = theme === key;
        return (
          <button
            key={key}
            onClick={() => setTheme(key)}
            title={label}
            aria-label={`Switch to ${label} theme`}
            className={`p-1.5 rounded-md transition-colors ${
              isActive
                ? 'text-brand-pink bg-brand-pink/10'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}
