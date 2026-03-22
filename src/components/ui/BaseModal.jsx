import { useEffect, useCallback, useRef } from 'react';
import { FiX } from 'react-icons/fi';

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
};

export default function BaseModal({
  isOpen,
  onClose,
  children,
  size = 'md',
  title,
  subtitle,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  blur = true,
  backdropOpacity = 50,
  zIndex = 50,
  variant = 'centered',
  maxHeight = '85vh',
  scrollable = true,
  stickyHeader = false,
  className = '',
  headerClassName = '',
  footerClassName = '',
}) {
  const modalRef = useRef(null);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (closeOnBackdrop && e.target === e.currentTarget) onClose();
    },
    [closeOnBackdrop, onClose]
  );

  if (!isOpen) return null;

  const isCentered = variant === 'centered';
  const isBottomSheet = variant === 'bottom-sheet';

  // Use inline style for dynamic z-index and max-height to avoid Tailwind JIT issues
  const zStyle = { zIndex };
  const maxHeightStyle = maxHeight ? { maxHeight } : {};

  const backdropClasses = [
    'fixed inset-0 flex p-4',
    backdropOpacity === 60 ? 'bg-black/60' : 'bg-black/50',
    blur ? 'backdrop-blur-sm' : '',
    isCentered ? 'items-center justify-center' : '',
    isBottomSheet ? 'items-end sm:items-center justify-center' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const containerClasses = [
    'w-full',
    SIZE_MAP[size] || SIZE_MAP.md,
    isCentered
      ? 'bg-surface-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700'
      : '',
    isBottomSheet ? 'relative' : '',
    scrollable ? 'flex flex-col' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const innerClasses = isBottomSheet
    ? 'bg-surface-card sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden'
    : '';

  const headerClasses = [
    'px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0',
    stickyHeader ? 'sticky top-0 bg-surface-card z-10 rounded-t-xl' : '',
    headerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const bodyClasses = scrollable ? 'flex-1 overflow-y-auto' : '';

  const footerClasses = [
    'px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0',
    footerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {title && (
        <div className={headerClasses}>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}
      <div className={bodyClasses}>{children}</div>
      {footer && <div className={footerClasses}>{footer}</div>}
    </>
  );

  return (
    <div
      className={backdropClasses}
      style={zStyle}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      {isBottomSheet ? (
        <div className={containerClasses}>
          <div className={innerClasses} ref={modalRef}>
            {content}
          </div>
        </div>
      ) : (
        <div className={containerClasses} style={maxHeightStyle} ref={modalRef}>
          {content}
        </div>
      )}
    </div>
  );
}
