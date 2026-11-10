import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TaskBoard from '../components/TaskBoard';

const tasks = [
  {
    id: 'task-1',
    title: 'Write docs',
    description: 'Cover the API',
    priority: 'HIGH',
    status: 'TODO',
    dueDate: '2026-11-10',
  },
  {
    id: 'task-2',
    title: 'Fix login bug',
    description: '',
    priority: 'LOW',
    status: 'DONE',
    dueDate: '2026-10-30',
  },
];

function renderBoard(overrides = {}) {
  const handlers = {
    onMove: vi.fn(),
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<TaskBoard tasks={tasks} {...handlers} />);
  return handlers;
}

describe('TaskBoard', () => {
  it('shows each task', () => {
    renderBoard();

    expect(screen.getByText('Write docs')).toBeInTheDocument();
    expect(screen.getByText('Fix login bug')).toBeInTheDocument();
  });

  it('shows the empty message for a column with no tasks', () => {
    renderBoard();

    // Only In Progress is empty in this data
    expect(screen.getByText('Drop tasks here')).toBeInTheDocument();
  });

  it('opens the add form for the column that was clicked', async () => {
    const user = userEvent.setup();
    const { onAdd } = renderBoard();

    await user.click(screen.getByRole('button', { name: 'Add task to In Progress' }));

    expect(onAdd).toHaveBeenCalledWith('IN_PROGRESS');
  });

  it('passes the task to onEdit when its edit button is clicked', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderBoard();

    await user.click(screen.getAllByRole('button', { name: 'Edit task' })[0]);

    expect(onEdit).toHaveBeenCalledWith(tasks[0]);
  });
});
