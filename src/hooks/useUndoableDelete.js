import { useEffect, useRef, useState } from 'react';

export const UNDO_MS = 5000;

// Hides a task straight away and deletes it after UNDO_MS, unless the user clicks Undo.
// Only one delete waits at a time: scheduling another one commits the previous delete first.
export default function useUndoableDelete(notify) {
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const pending = useRef(null); // { task, remove, onDone, timer }

  function unhide(id) {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function commit(entry) {
    try {
      await entry.remove(entry.task);
      entry.onDone?.();
    } catch (err) {
      unhide(entry.task.id);
      notify(err.message, 'error');
    }
  }

  function flush() {
    const entry = pending.current;
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.current = null;
    commit(entry);
  }

  function undo(entry) {
    if (pending.current !== entry) return;
    clearTimeout(entry.timer);
    pending.current = null;
    unhide(entry.task.id);
    notify('Delete undone', 'success');
  }

  // task: the task to delete; remove(task) performs the API call; onDone runs after it succeeds
  function scheduleDelete({ task, remove, onDone }) {
    flush();

    const entry = { task, remove, onDone, timer: null };
    entry.timer = setTimeout(() => {
      if (pending.current === entry) {
        pending.current = null;
        commit(entry);
      }
    }, UNDO_MS);
    pending.current = entry;

    setHiddenIds((prev) => new Set(prev).add(task.id));
    notify('Task deleted', 'success', {
      duration: UNDO_MS,
      action: { label: 'Undo', onClick: () => undo(entry) },
    });
  }

  // If the user leaves the screen before the timer ends, the delete still goes through
  useEffect(() => flush, []);

  return { hiddenIds, scheduleDelete };
}
