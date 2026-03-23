import { useState, useCallback } from 'react';
import { buildEditableItem, toUpdateRequest } from '@/lib/study/itemEditing';
import { clientLog } from '@/lib/clientLogger';

export default function useItemEditing() {
  const [editingItem, setEditingItem] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  const openEdit = useCallback((item) => {
    const editable = buildEditableItem(item);
    if (!editable) {
      setEditError('This item cannot be edited right now.');
      return;
    }

    setEditError(null);
    setEditingItem(editable);
  }, []);

  const closeEdit = useCallback(() => {
    if (isSavingEdit) return;
    setEditingItem(null);
    setEditError(null);
  }, [isSavingEdit]);

  const saveEdit = useCallback(async (updatedItem, arraySetters) => {
    setIsSavingEdit(true);
    setEditError(null);

    try {
      const request = toUpdateRequest(updatedItem);
      const response = await fetch(
        '/api/database/v2/sets/update-from-full-set',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        }
      );

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update item');
      }

      // Apply merge to each array setter provided by the caller
      for (const { setState, mergeFn } of arraySetters) {
        setState((prev) => prev.map((item) => mergeFn(item, updatedItem)));
      }

      setEditingItem(null);
    } catch (error) {
      clientLog.error('study.edit_item_failed', {
        error: error?.message || String(error),
      });
      setEditError(error.message || 'Failed to update item');
    } finally {
      setIsSavingEdit(false);
    }
  }, []);

  return {
    editingItem,
    isSavingEdit,
    editError,
    openEdit,
    closeEdit,
    saveEdit,
  };
}
