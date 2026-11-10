import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TaskCard from './TaskCard';

const task = {
  id: 'task-12345',
  title: 'Write docs',
  description: 'Cover the API',
  priority: 'HIGH',
  status: 'TODO',
  dueDate: '2026-03-05',
};

function renderCard(overrides = {}) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onDragStart: vi.fn(), ...overrides };
  render(<TaskCard task={task} {...handlers} />);
  return handlers;
}

describe('TaskCard', () => {
  it('shows the title, description, priority and due date', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: 'Write docs' })).toBeInTheDocument();
    expect(screen.getByText('Cover the API')).toBeInTheDocument();
    expect(screen.getByText('⚑ High')).toBeInTheDocument();
    expect(screen.getByText('◷ 5 March')).toBeInTheDocument();
  });

  it('shows the last five characters of the id as the label', () => {
    renderCard();

    expect(screen.getByText('#12345')).toBeInTheDocument();
  });

  it('omits the description when there is none', () => {
    const { container } = render(
      <TaskCard task={{ ...task, description: '' }} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(container.querySelector('.desc')).toBeNull();
  });

  it('passes the task to onEdit when edit is clicked', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderCard();

    await user.click(screen.getByRole('button', { name: 'Edit task' }));

    expect(onEdit).toHaveBeenCalledWith(task);
  });

  it('passes the task id to onDelete when delete is clicked', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderCard();

    const article = screen.getByRole('article');
    await user.click(within(article).getByRole('button', { name: 'Delete task' }));

    expect(onDelete).toHaveBeenCalledWith('task-12345');
  });
});
