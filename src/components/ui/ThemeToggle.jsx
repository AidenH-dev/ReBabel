import { useTheme } from '@/contexts/ThemeContext';
import {
  TbSun,
  TbMoon,
  TbMoonStars,
  TbLeaf,
  TbDeviceDesktop,
} from 'react-icons/tb';

const THEMES = [
  { key: 'system', icon: TbDeviceDesktop, label: 'System' },
  { key: 'light', icon: TbSun, label: 'Light' },
  { key: 'dark', icon: TbMoon, label: 'Dark' },
  { key: 'cream', icon: TbLeaf, label: 'Cream' },
  { key: 'dusk', icon: TbMoonStars, label: 'Dusk' },
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
