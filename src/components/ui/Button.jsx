import { forwardRef } from 'react';

/**
 * Shared Button component. Every visual variant from the codebase is preserved.
 * The component handles shared behavior (disabled state, transitions, focus ring)
 * while the `variant` prop selects the exact visual style.
 *
 * Usage:
 *   <Button variant="primary">Create Set</Button>
 *   <Button variant="secondary">Cancel</Button>
 *   <Button variant="ghost" size="icon"><FiX /></Button>
 *   <Button variant="danger">Delete</Button>
 *   <Button className="custom-classes">Custom</Button>
 */

const VARIANTS = {
  // Pink solid — hover lighter
  primary: 'bg-brand-pink hover:bg-brand-pink-hover text-white',

  // Pink solid — hover opacity (used in set management, CSV, config panels)
  'primary-subtle': 'bg-brand-pink text-white hover:opacity-95',

  // Pink gradient CTA
  'primary-gradient':
    'bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white hover:shadow-lg',

  // Academy purple gradient
  academy:
    'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:brightness-110',

  // Flashcards gradient
  flashcards:
    'bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white hover:brightness-110',

  // Secondary gray
  secondary:
    'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',

  // Outlined gray border
  outline:
    'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-elevated bg-transparent',

  // Ghost — no bg, hover highlight (for icon buttons, close buttons)
  ghost:
    'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent',

  // Ghost with neutral fill (exit buttons, close in headers)
  'ghost-filled':
    'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white',

  // Danger solid red
  danger: 'bg-red-600 hover:bg-red-700 text-white',

  // Danger outlined
  'danger-outline':
    'text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 bg-transparent',

  // Danger soft
  'danger-soft':
    'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200',

  // Warning amber
  warning: 'bg-amber-600 hover:bg-amber-700 text-white',

  // Pink outlined
  'pink-outline':
    'border-2 border-brand-pink text-brand-pink hover:bg-brand-pink/10 bg-transparent',

  // Pink tint / ghost pink
  'pink-ghost': 'bg-brand-pink/10 text-brand-pink hover:bg-brand-pink/20',

  // White on colored background
  'white-solid': 'bg-white text-brand-pink font-semibold hover:bg-gray-100',

  // Text-only link style
  link: 'text-brand-pink hover:underline bg-transparent p-0',

  // SRS interval buttons
  'srs-again':
    'bg-red-100 dark:bg-red-500/20 hover:bg-red-200 text-red-600 dark:text-red-400 active:scale-95',
  'srs-hard':
    'bg-orange-100 dark:bg-orange-500/20 hover:bg-orange-200 text-orange-600 dark:text-orange-400 active:scale-95',
  'srs-good':
    'bg-blue-100 dark:bg-blue-500/20 hover:bg-blue-200 text-blue-600 dark:text-blue-400 active:scale-95',
  'srs-easy':
    'bg-green-100 dark:bg-green-500/20 hover:bg-green-200 text-green-600 dark:text-green-400 active:scale-95',

  // Session next (purple gradient)
  'session-next':
    'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white active:scale-95',

  // Finish session (green)
  'finish-session':
    'bg-green-600 hover:bg-green-500 text-white active:scale-95',

  // Unstyled — use className for fully custom styles
  none: '',
};

const SIZES = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
  'icon-sm': 'p-1.5',
};

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    className = '',
    disabled = false,
    children,
    ...props
  },
  ref
) {
  const variantClasses = VARIANTS[variant] || '';
  const sizeClasses = SIZES[size] || SIZES.md;

  const baseClasses = [
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-1',
    variantClasses,
    variant !== 'link' ? sizeClasses : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button ref={ref} className={baseClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
});

export default Button;

// Export variants map for reference
export { VARIANTS, SIZES };
