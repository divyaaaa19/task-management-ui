import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPanel from '../components/AdminPanel';
import { adminApi } from '../api/taskApi';

vi.mock('../api/taskApi', () => ({
  adminApi: {
    users: vi.fn(),
    tasks: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

// Past and future dates keep the overdue checks independent of the day the tests run
const users = [
  { id: 'u1', name: 'Asha Rao', email: 'asha@x.com', role: 'USER' },
  { id: 'u2', name: 'Ravi Kumar', email: 'ravi@x.com', role: 'ADMIN' },
];

const tasksByUser = {
  u1: {
    content: [
      { id: 't1', title: 'Pay rent', description: '', priority: 'HIGH', status: 'TODO', dueDate: '2020-01-01' },
      { id: 't2', title: 'Plan trip', description: '', priority: 'LOW', status: 'DONE', dueDate: '2020-02-01' },
      { id: 't3', title: 'Write report', description: '', priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: '2099-01-01' },
    ],
  },
  u2: { content: [] },
};

// Deleting waits out the 5-second undo window before the API call
const UNDO_WAIT = { timeout: 7000 };

function renderPanel() {
  const onToast = vi.fn();
  render(<AdminPanel onToast={onToast} />);
  return { onToast };
}

async function selectAsha(user) {
  await user.click(await screen.findByRole('button', { name: /Asha Rao/ }));
}

function dialog() {
  return within(screen.getByRole('alertdialog'));
}

describe('AdminPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.users.mockResolvedValue(users);
    adminApi.tasks.mockImplementation(async (userId) => tasksByUser[userId]);
  });

  it('lists users with their task count and overdue count', async () => {
    renderPanel();

    expect(await screen.findByText('3 tasks')).toBeInTheDocument();
    expect(screen.getByText('1 overdue')).toBeInTheDocument();
    expect(screen.getByText('0 tasks')).toBeInTheDocument();
  });

  it('marks admin users with a badge', async () => {
    renderPanel();

    expect(await screen.findByText('Admin')).toBeInTheDocument();
  });

  it('shows the empty state until a user is selected', async () => {
    renderPanel();

    expect(await screen.findByText('No user selected')).toBeInTheDocument();
  });

  it('filters the user list by name or email', async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByRole('button', { name: /Ravi Kumar/ });

    await user.type(screen.getByPlaceholderText('Search users'), 'asha@');

    expect(screen.queryByRole('button', { name: /Ravi Kumar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Asha Rao/ })).toBeInTheDocument();
  });

  it('loads and shows the selected user tasks and their summary', async () => {
    const user = userEvent.setup();
    renderPanel();
    await selectAsha(user);

    expect(await screen.findByText('Pay rent')).toBeInTheDocument();
    expect(screen.getByText('Plan trip')).toBeInTheDocument();
    expect(adminApi.tasks).toHaveBeenCalledWith('u1');
    expect(screen.getByRole('heading', { level: 2, name: 'Asha Rao' })).toBeInTheDocument();
  });

  it('creates a task for the selected user', async () => {
    const user = userEvent.setup();
    const { onToast } = renderPanel();
    await selectAsha(user);
    await screen.findByText('Pay rent');
    adminApi.create.mockResolvedValue({});

    await user.click(screen.getByRole('button', { name: '+ Add Task' }));
    await user.type(screen.getByLabelText('Title'), 'Call bank');
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-12-01' } });
    await user.click(screen.getByRole('button', { name: 'Create task' }));

    expect(adminApi.create).toHaveBeenCalledWith(
      'u1',
      expect.objectContaining({ title: 'Call bank', status: 'TODO' }),
    );
    expect(onToast).toHaveBeenCalledWith('Task created');
  });

  it('hides the task at once and deletes it after the undo window', async () => {
    const user = userEvent.setup();
    const { onToast } = renderPanel();
    await selectAsha(user);
    const card = (await screen.findByText('Pay rent')).closest('article');
    adminApi.remove.mockResolvedValue(null);

    await user.click(within(card).getByRole('button', { name: 'Delete task' }));
    await dialog().findByText(/"Pay rent" will be removed/);
    await user.click(dialog().getByRole('button', { name: 'Delete' }));

    expect(screen.queryByText('Pay rent')).not.toBeInTheDocument();
    expect(onToast).toHaveBeenCalledWith('Task deleted', 'success', expect.any(Object));
    expect(adminApi.remove).not.toHaveBeenCalled();

    await waitFor(() => expect(adminApi.remove).toHaveBeenCalledWith('u1', 't1'), UNDO_WAIT);
  }, 10000);

  it('restores the task when undo is clicked', async () => {
    const user = userEvent.setup();
    const { onToast } = renderPanel();
    await selectAsha(user);
    const card = (await screen.findByText('Pay rent')).closest('article');

    await user.click(within(card).getByRole('button', { name: 'Delete task' }));
    await user.click(dialog().getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('Pay rent')).not.toBeInTheDocument();

    const undoOptions = onToast.mock.calls.find(([msg]) => msg === 'Task deleted')[2];
    undoOptions.action.onClick();

    expect(await screen.findByText('Pay rent')).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 50));
    expect(adminApi.remove).not.toHaveBeenCalled();
  });

  it('does not delete when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    renderPanel();
    await selectAsha(user);
    const card = (await screen.findByText('Pay rent')).closest('article');

    await user.click(within(card).getByRole('button', { name: 'Delete task' }));
    await user.click(dialog().getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByText('Pay rent')).toBeInTheDocument();
    expect(adminApi.remove).not.toHaveBeenCalled();
  });

  it('adds the same task to every user after confirmation', async () => {
    const user = userEvent.setup();
    const { onToast } = renderPanel();
    await screen.findByText('3 tasks');
    adminApi.create.mockResolvedValue({});

    await user.click(screen.getByRole('button', { name: 'Add task to all users' }));
    await user.type(screen.getByLabelText('Title'), 'Team meeting');
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-12-01' } });
    await user.click(screen.getByRole('button', { name: 'Create for 2 users' }));
    await user.click(dialog().getByRole('button', { name: 'Yes, create' }));

    expect(adminApi.create).toHaveBeenCalledTimes(2);
    expect(adminApi.create).toHaveBeenCalledWith('u1', expect.objectContaining({ title: 'Team meeting' }));
    expect(adminApi.create).toHaveBeenCalledWith('u2', expect.objectContaining({ title: 'Team meeting' }));
    expect(onToast).toHaveBeenCalledWith('Added to all 2 users', 'success');
  });

  it('reports partial failures when adding to all users', async () => {
    const user = userEvent.setup();
    const { onToast } = renderPanel();
    await screen.findByText('3 tasks');
    adminApi.create.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Server error'));

    await user.click(screen.getByRole('button', { name: 'Add task to all users' }));
    await user.type(screen.getByLabelText('Title'), 'Team meeting');
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-12-01' } });
    await user.click(screen.getByRole('button', { name: 'Create for 2 users' }));
    await user.click(dialog().getByRole('button', { name: 'Yes, create' }));

    expect(onToast).toHaveBeenCalledWith('Added to 1 users, 1 failed', 'error');
  });

  it('creates nothing when the bulk add is cancelled', async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText('3 tasks');

    await user.click(screen.getByRole('button', { name: 'Add task to all users' }));
    await user.type(screen.getByLabelText('Title'), 'Team meeting');
    fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-12-01' } });
    await user.click(screen.getByRole('button', { name: 'Create for 2 users' }));
    await user.click(dialog().getByRole('button', { name: 'Cancel' }));

    expect(adminApi.create).not.toHaveBeenCalled();
  });

  it('shows an error when the users cannot be loaded', async () => {
    adminApi.users.mockRejectedValue(new Error('Forbidden'));

    renderPanel();

    expect(await screen.findByText('Could not load users: Forbidden')).toBeInTheDocument();
  });
});
