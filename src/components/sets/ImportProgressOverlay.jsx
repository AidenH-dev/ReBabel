import { TbCheck, TbDownload } from 'react-icons/tb';

/**
 * Shared import progress overlay used in both the ImportByCodeModal
 * and the /learn/academy/sets/import/[token] page.
 *
 * @param {object} props
 * @param {'set'|'items'|'linking'|'done'} props.importStage
 * @param {number} props.importProgress - 0-100
 * @param {number} [props.itemCount] - number of items being imported
 * @param {'overlay'|'inline'} [props.variant] - 'overlay' adds backdrop blur, 'inline' renders card only
 */
export default function ImportProgressOverlay({
  importStage,
  importProgress,
  itemCount = 0,
  variant = 'overlay',
}) {
  const card = (
    <div className="bg-surface-card rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-8 w-full max-w-sm mx-4 text-center">
      {importStage === 'done' ? (
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <TbCheck className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
      ) : (
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-brand-pink/10 flex items-center justify-center">
          <TbDownload className="w-7 h-7 text-brand-pink animate-bounce" />
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
        {importStage === 'done' ? 'Import Complete!' : 'Importing Set...'}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        {importStage === 'set' && 'Creating your copy of the set...'}
        {importStage === 'items' && `Importing ${itemCount} items...`}
        {importStage === 'linking' && 'Linking items to your set...'}
        {importStage === 'done' && 'Redirecting to your new set...'}
      </p>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            importStage === 'done'
              ? 'bg-green-500'
              : 'bg-gradient-to-r from-brand-pink to-brand-pink-hover'
          }`}
          style={{ width: `${importProgress}%` }}
        />
      </div>

      {/* Stage indicators */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span
          className={
            importStage === 'set' || importProgress > 30
              ? 'text-brand-pink dark:text-brand-pink-hover font-medium'
              : ''
          }
        >
          {importProgress > 30 ? '\u2713' : '\u25CF'} Set
        </span>
        <span
          className={
            importStage === 'items' || importProgress > 70
              ? 'text-brand-pink dark:text-brand-pink-hover font-medium'
              : ''
          }
        >
          {importProgress > 70
            ? '\u2713'
            : importStage === 'items'
              ? '\u25CF'
              : '\u25CB'}{' '}
          Items
        </span>
        <span
          className={
            importStage === 'linking' || importStage === 'done'
              ? 'text-brand-pink dark:text-brand-pink-hover font-medium'
              : ''
          }
        >
          {importStage === 'done'
            ? '\u2713'
            : importStage === 'linking'
              ? '\u25CF'
              : '\u25CB'}{' '}
          Link
        </span>
        <span
          className={
            importStage === 'done'
              ? 'text-green-600 dark:text-green-400 font-medium'
              : ''
          }
        >
          {importStage === 'done' ? '\u2713' : '\u25CB'} Done
        </span>
      </div>
    </div>
  );

  if (variant === 'inline') return card;

  return (
    <div className="absolute inset-0 z-20 bg-gray-50/80 dark:bg-surface-page/80 backdrop-blur-sm flex items-center justify-center">
      {card}
    </div>
  );
}
