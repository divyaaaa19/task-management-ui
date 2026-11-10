import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import useUndoableDelete, { UNDO_MS } from '../hooks/useUndoableDelete';

const task = { id: 't1', title: 'Pay rent' };

describe('useUndoableDelete', () => {
  let notify;

  beforeEach(() => {
    vi.useFakeTimers();
    notify = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hides the task at once and removes it after the undo window', async () => {
    const remove = vi.fn().mockResolvedValue(null);
    const onDone = vi.fn();
    const { result } = renderHook(() => useUndoableDelete(notify));

    act(() => {
      result.current.scheduleDelete({ task, remove, onDone });
    });

    expect(result.current.hiddenIds.has('t1')).toBe(true);
    expect(remove).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(UNDO_MS);
    });

    expect(remove).toHaveBeenCalledWith(task);
    expect(onDone).toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      'Task deleted',
      'success',
      expect.objectContaining({ duration: UNDO_MS, action: expect.any(Object) }),
    );
  });

  it('restores the task and skips the API call when undo is clicked', async () => {
    const remove = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useUndoableDelete(notify));

    act(() => {
      result.current.scheduleDelete({ task, remove, onDone: vi.fn() });
    });
    const [, , options] = notify.mock.calls[0];

    act(() => {
      options.action.onClick();
    });

    expect(result.current.hiddenIds.has('t1')).toBe(false);
    expect(notify).toHaveBeenLastCalledWith('Delete undone', 'success');

    await act(async () => {
      vi.advanceTimersByTime(UNDO_MS * 2);
    });
    expect(remove).not.toHaveBeenCalled();
  });

  it('commits a pending delete right away when the component unmounts', async () => {
    const remove = vi.fn().mockResolvedValue(null);
    const { result, unmount } = renderHook(() => useUndoableDelete(notify));

    act(() => {
      result.current.scheduleDelete({ task, remove, onDone: vi.fn() });
    });
    await act(async () => {
      unmount();
    });

    expect(remove).toHaveBeenCalledWith(task);
  });

  it('unhides the task and reports an error when the removal fails', async () => {
    const remove = vi.fn().mockRejectedValue(new Error('Server down'));
    const { result } = renderHook(() => useUndoableDelete(notify));

    act(() => {
      result.current.scheduleDelete({ task, remove, onDone: vi.fn() });
    });
    await act(async () => {
      vi.advanceTimersByTime(UNDO_MS);
    });

    expect(result.current.hiddenIds.has('t1')).toBe(false);
    expect(notify).toHaveBeenLastCalledWith('Server down', 'error');
  });
});
