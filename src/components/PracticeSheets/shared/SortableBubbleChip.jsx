import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaTimes } from 'react-icons/fa';
import { getTextWidthPx } from './helpers';

export default function SortableBubbleChip({
  item,
  index,
  onChange,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.85 : 1,
      }}
      className="flex shrink-0 cursor-grab select-none items-center gap-1 rounded-full border border-brand-pink/25 bg-brand-pink/10 px-2 py-0.5 text-brand-pink active:cursor-grabbing"
    >
      <input
        value={item.value}
        onChange={(event) => onChange(index, event.target.value)}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        style={{ width: `${Math.max(getTextWidthPx(item.value) + 3, 22)}px` }}
        className="bg-transparent text-sm text-brand-pink outline-none"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className="rounded-sm pl-0.5 pr-0 text-xs text-brand-pink/80 transition hover:text-brand-pink"
        aria-label="Remove item"
      >
        <FaTimes className="text-[10px]" />
      </button>
    </div>
  );
}
