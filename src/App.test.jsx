import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { adminApi, profileApi, roleFromToken, session, taskApi } from './api/taskApi';

vi.mock('./api/taskApi', () => ({
  session: { get: vi.fn(), save: vi.fn(), setUser: vi.fn(), clear: vi.fn() },
  roleFromToken: vi.fn(),
  authApi: { login: vi.fn(), register: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn() },
  taskApi: { list: vi.fn(), summary: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), rollover: vi.fn() },
  adminApi: { users: vi.fn(), tasks: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  profileApi: { get: vi.fn(), update: vi.fn() },
}));

const loggedInUser = { name: 'Divya Paluru', email: 'd@x.com' };

const tasks = [
  { id: 'task-1', title: 'Write docs', description: '', priority: 'HIGH', status: 'TODO', dueDate: '2099-12-01' },
];

const summary = { total: 1, todo: 1, inProgress: 0, done: 0, overdue: 0 };

function loginAs(role) {
  session.get.mockReturnValue({ token: 'token-123', user: loggedInUser });
  roleFromToken.mockReturnValue(role);
  taskApi.list.mockResolvedValue({ content: tasks });
  taskApi.summary.mockResolvedValue(summary);
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminApi.users.mockResolvedValue([]);
    profileApi.get.mockResolvedValue({ ...loggedInUser, mobile: '' });
  });

  it('shows the login page when there is no session', async () => {
    session.get.mockReturnValue(null);

    render(<App />);

    expect((await screen.findAllByRole('button', { name: 'Log in' })).length).toBeGreaterThan(0);
    expect(taskApi.list).not.toHaveBeenCalled();
  });

  it('shows the task list and summary for a signed-in user', async () => {
    loginAs('USER');

    render(<App />);

    expect(await screen.findByText('Write docs')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(taskApi.list).toHaveBeenCalled();
  });

  it('hides the admin menu from regular users', async () => {
    loginAs('USER');

    render(<App />);
    await screen.findByText('Write docs');

    expect(screen.queryByRole('button', { name: 'Users (Admin)' })).not.toBeInTheDocument();
  });

  it('lets an admin open the user management view', async () => {
    const user = userEvent.setup();
    loginAs('ADMIN');

    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Users (Admin)' }));

    expect(await screen.findByText("Manage any user's tasks")).toBeInTheDocument();
    expect(await screen.findByText('No users found')).toBeInTheDocument();
    expect(adminApi.users).toHaveBeenCalled();
  });

  it('logs out and returns to the login page', async () => {
    const user = userEvent.setup();
    loginAs('USER');

    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    expect(session.clear).toHaveBeenCalled();
    expect((await screen.findAllByRole('button', { name: 'Log in' })).length).toBeGreaterThan(0);
  });
});
