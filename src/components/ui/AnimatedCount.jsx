/**
 * AnimatedCount — prevents the 0-to-N flash when dynamic counts load.
 * Shows an inline skeleton while loading, then fades the value in.
 * Use `minWidth` to reserve space and prevent layout shift.
 */
export default function AnimatedCount({
  value,
  isLoading,
  skeletonWidth = 'w-6',
  minWidth,
  className = '',
}) {
  const sizeStyle = minWidth ? { minWidth } : undefined;

  if (isLoading) {
    return (
      <span
        className={`inline-block ${skeletonWidth} h-[1em] rounded bg-black/[0.06] dark:bg-white/[0.06] animate-pulse align-middle`}
        style={sizeStyle}
      />
    );
  }

  return (
    <span
      className={`inline-block transition-opacity duration-200 ${className}`}
      style={{ opacity: value != null ? 1 : 0, ...sizeStyle }}
    >
      {value}
    </span>
  );
}
