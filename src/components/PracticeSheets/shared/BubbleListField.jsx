import { useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableBubbleChip from './SortableBubbleChip';

export default function BubbleListField({
  label,
  items,
  onAdd,
  onChange,
  onRemove,
  onReorder,
  placeholder,
}) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const submitDraft = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft('');
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
      }
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 transition focus-within:border-brand-pink focus-within:bg-white focus-within:ring-1 focus-within:ring-brand-pink/20 dark:border-gray-700 dark:bg-surface-deep dark:text-white dark:focus-within:bg-surface-card">
        <div
          ref={scrollRef}
          className="flex min-h-[28px] items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={horizontalListSortingStrategy}
            >
              {items.map((item, index) => (
                <SortableBubbleChip
                  key={item.id}
                  item={item}
                  index={index}
                  onChange={onChange}
                  onRemove={onRemove}
                />
              ))}
            </SortableContext>
          </DndContext>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitDraft();
              }
            }}
            placeholder={placeholder}
            className="min-w-[8rem] flex-1 bg-transparent py-0.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
          />
        </div>
      </div>
    </label>
  );
}
