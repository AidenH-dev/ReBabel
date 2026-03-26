export default function GuideStyleSelector({
  showGuides,
  guideStyle,
  onShowGuidesChange,
  onGuideStyleChange,
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        Guides
      </p>
      <div className="grid grid-cols-3 rounded-lg bg-black/[0.04] p-1 dark:bg-white/[0.06]">
        <button
          type="button"
          onClick={() => onShowGuidesChange(false)}
          className={`rounded-md px-3 py-2 text-xs font-medium transition ${
            !showGuides
              ? 'bg-white text-brand-pink shadow-sm dark:bg-surface-deep'
              : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
          }`}
        >
          None
        </button>
        <button
          type="button"
          onClick={() => {
            onShowGuidesChange(true);
            onGuideStyleChange('standard');
          }}
          className={`rounded-md px-3 py-2 text-xs font-medium transition ${
            showGuides && guideStyle === 'standard'
              ? 'bg-white text-brand-pink shadow-sm dark:bg-surface-deep'
              : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
          }`}
        >
          Standard
        </button>
        <button
          type="button"
          onClick={() => {
            onShowGuidesChange(true);
            onGuideStyleChange('dotted-cross');
          }}
          className={`rounded-md px-3 py-2 text-xs font-medium transition ${
            showGuides && guideStyle === 'dotted-cross'
              ? 'bg-white text-brand-pink shadow-sm dark:bg-surface-deep'
              : 'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white'
          }`}
        >
          Dotted
        </button>
      </div>
    </div>
  );
}
