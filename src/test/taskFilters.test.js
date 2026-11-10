import { describe, expect, it } from 'vitest';
import { filterTasks, sortTasks } from '../utils/taskFilters';

const TODAY = '2026-06-15';

const tasks = [
  { id: 'a', title: 'Due today', priority: 'LOW', status: 'TODO', dueDate: TODAY, createdAt: '2026-06-01T10:00:00' },
  { id: 'b', title: 'Overdue', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: '2026-06-10', createdAt: '2026-06-02T10:00:00' },
  { id: 'c', title: 'Overdue but done', priority: 'MEDIUM', status: 'DONE', dueDate: '2026-06-09', createdAt: '2026-06-03T10:00:00' },
  { id: 'd', title: 'Future', priority: 'MEDIUM', status: 'TODO', dueDate: '2026-07-01', createdAt: '2026-06-04T10:00:00' },
];

describe('filterTasks', () => {
  it('keeps every task when no due filter is set', () => {
    expect(filterTasks(tasks, 'all', TODAY)).toHaveLength(4);
  });

  it('keeps only tasks due today', () => {
    expect(filterTasks(tasks, 'today', TODAY).map((t) => t.id)).toEqual(['a']);
  });

  it('keeps only overdue tasks that are not done', () => {
    expect(filterTasks(tasks, 'overdue', TODAY).map((t) => t.id)).toEqual(['b']);
  });
});

describe('sortTasks', () => {
  it('sorts by due date, earliest first', () => {
    expect(sortTasks(tasks, 'due').map((t) => t.id)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('sorts by priority, high first, then due date', () => {
    expect(sortTasks(tasks, 'priority').map((t) => t.priority)).toEqual([
      'HIGH',
      'MEDIUM',
      'MEDIUM',
      'LOW',
    ]);
  });

  it('sorts newest created first', () => {
    expect(sortTasks(tasks, 'newest').map((t) => t.id)).toEqual(['d', 'c', 'b', 'a']);
  });
});
