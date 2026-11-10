import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TaskModal from './TaskModal';

const existingTask = {
  id: 'task-1',
  title: 'Write docs',
  description: 'Cover the API',
  priority: 'LOW',
  status: 'IN_PROGRESS',
  dueDate: '2026-12-01',
};

describe('TaskModal', () => {
  it('creates a task with default values and a trimmed title', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TaskModal onSave={onSave} onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('Title'), '  Buy milk  ');
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-12-05' } });
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(onSave).toHaveBeenCalledWith({
      title: 'Buy milk',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '2026-12-05',
    });
  });

  it('uses the default status passed in for a new task', () => {
    render(<TaskModal defaultStatus="IN_PROGRESS" onSave={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByLabelText('Status')).toHaveValue('IN_PROGRESS');
  });

  it('does not save when the title is only spaces', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TaskModal onSave={onSave} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-12-05' } });
    await user.type(screen.getByLabelText('Title'), '   ');
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(onSave).not.toHaveBeenCalled();
  });

  it('prefills the form when editing and saves the changes', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<TaskModal task={existingTask} onSave={onSave} onClose={vi.fn()} />);

    expect(screen.getByLabelText('Title')).toHaveValue('Write docs');
    expect(screen.getByLabelText('Description')).toHaveValue('Cover the API');
    expect(screen.getByLabelText('Due date')).toHaveValue('2026-12-01');

    await user.selectOptions(screen.getByLabelText('Priority'), 'HIGH');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith({
      title: 'Write docs',
      description: 'Cover the API',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2026-12-01',
    });
  });

  it('uses the heading and submit label it is given', () => {
    render(
      <TaskModal
        heading="New task for all users"
        submitLabel="Create for 3 users"
        onSave={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'New task for all users' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create for 3 users' })).toBeInTheDocument();
  });

  it('closes when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<TaskModal onSave={vi.fn()} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked but not when the form is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(<TaskModal onSave={vi.fn()} onClose={onClose} />);

    await user.click(screen.getByRole('heading', { name: 'New task' }));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(container.querySelector('.modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
