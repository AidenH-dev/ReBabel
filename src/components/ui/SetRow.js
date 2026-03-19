import Link from 'next/link';
import { FiPlay } from 'react-icons/fi';
import { FaRegFolderOpen } from 'react-icons/fa6';

function getTypeIndicator(setType) {
  if (setType === 'vocab') {
    return { label: 'Vocab', colorClass: 'bg-blue-100 dark:bg-blue-900/30' };
  } else if (setType === 'grammar') {
    return {
      label: 'Grammar',
      colorClass: 'bg-green-100 dark:bg-green-900/30',
    };
  } else {
    return {
      label: 'V & G',
      colorClass: 'bg-purple-100 dark:bg-purple-900/30',
    };
  }
}

/**
 * SetRow — list-style row for displaying a set.
 *
 * @param {object} set - { id, name, item_num, date, set_type }
 * @param {function} [formatDate] - optional date formatter (omit to hide date)
 */
export default function SetRow({ set, formatDate }) {
  const typeIndicator = getTypeIndicator(set.set_type);

  return (
    <div className="flex items-center justify-between gap-3 bg-white/70 dark:bg-white/[0.02] px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {set.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-black/60 dark:text-white/60">
            {set.item_num} Items
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${typeIndicator.colorClass}`}
          >
            {typeIndicator.label}
          </span>
        </div>
      </div>
      {formatDate && (
        <div className="hidden sm:block text-[11px] text-black/60 dark:text-white/60 whitespace-nowrap">
          {formatDate(set.date)}
        </div>
      )}
      <div className="flex items-center gap-2">
        <Link
          href={`/learn/academy/sets/study/${set.id}/quiz`}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FiPlay /> Study
        </Link>
        <Link
          href={`/learn/academy/sets/study/${set.id}`}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-black/5 dark:bg-white/10 hover:opacity-90"
        >
          <FaRegFolderOpen /> Open
        </Link>
      </div>
    </div>
  );
}
