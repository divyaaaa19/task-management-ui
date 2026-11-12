import { describe, expect, it } from 'vitest';
import { overdueFirst, timeLeft } from '../utils/taskFilters';

// Fixed "now": 12 Nov 2026, 10:00 local time
const now = new Date(2026, 10, 12, 10, 0);

describe('timeLeft', () => {
  it('counts hours and minutes left until the end of the due day', () => {
    expect(timeLeft({ status: 'TODO', dueDate: '2026-11-12' }, now)).toEqual({
      overdue: false,
      tone: 'soon',
      label: '13h 59m left',
    });
  });

  it('counts days and hours for tasks due later', () => {
    expect(timeLeft({ status: 'TODO', dueDate: '2026-11-15' }, now)).toEqual({
      overdue: false,
      tone: '',
      label: '3d 13h 59m left',
    });
  });

  it('shows how late an overdue task is', () => {
    expect(timeLeft({ status: 'IN_PROGRESS', dueDate: '2026-11-10' }, now)).toEqual({
      overdue: true,
      tone: 'late',
      label: '1d 10h 0m late',
    });
  });

  it('uses the due time when one is set', () => {
    expect(timeLeft({ status: 'TODO', dueDate: '2026-11-12', dueTime: '19:00' }, now)).toEqual({
      overdue: false,
      tone: 'soon',
      label: '9h 0m left',
    });
  });

  it('returns null for done tasks', () => {
    expect(timeLeft({ status: 'DONE', dueDate: '2026-11-01' }, now)).toBeNull();
  });
});

describe('overdueFirst', () => {
  it('moves overdue tasks to the front and keeps the order of the rest', () => {
    const tasks = [
      { id: 'a', status: 'TODO', dueDate: '2026-11-20' },
      { id: 'b', status: 'TODO', dueDate: '2026-11-10' },
      { id: 'c', status: 'DONE', dueDate: '2026-11-01' },
    ];

    expect(overdueFirst(tasks, now).map((t) => t.id)).toEqual(['b', 'a', 'c']);
  });
});
