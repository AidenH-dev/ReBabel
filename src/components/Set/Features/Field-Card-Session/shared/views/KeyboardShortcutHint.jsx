import { FaKeyboard } from "react-icons/fa";

/**
 * KeyboardShortcutHint - Standardized keyboard shortcut display component
 *
 * Provides consistent styling for keyboard shortcut hints across all
 * learning activities (Flashcards, Multiple Choice, Typed Response, Review).
 *
 * @param {Object[]} shortcuts - Array of shortcut definitions
 * @param {string} shortcuts[].key - Key or key combo displayed (e.g., "Enter", "←/→")
 * @param {string} shortcuts[].label - Action description (e.g., "Submit", "Navigate")
 * @param {boolean} [desktopOnly=true] - Hide component on mobile (< md breakpoint)
 * @param {string} [className] - Additional CSS classes for wrapper
 */
export default function KeyboardShortcutHint({
  shortcuts = [],
  desktopOnly = true,
  className = ""
}) {
  if (!shortcuts || shortcuts.length === 0) return null;

  const visibilityClass = desktopOnly ? "hidden md:flex" : "flex";

  return (
    <div
      className={`
        ${visibilityClass}
        flex-wrap items-center justify-center gap-3 sm:gap-6
        text-xs text-gray-500 dark:text-white/40
        ${className}
      `}
    >
      <span className="flex items-center gap-2">
        <FaKeyboard />
        <span className="hidden sm:inline">Keyboard shortcuts:</span>
      </span>
      {shortcuts.map((shortcut, index) => (
        <span key={index}>
          {shortcut.key}: {shortcut.label}
        </span>
      ))}
    </div>
  );
}
