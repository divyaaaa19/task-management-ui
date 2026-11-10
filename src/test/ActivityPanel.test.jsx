import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ActivityPanel from '../components/ActivityPanel';
import { adminApi } from '../api/taskApi';

vi.mock('../api/taskApi', () => ({
  adminApi: {
    audit: vi.fn(),
    users: vi.fn(),
  },
}));

describe('ActivityPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows each admin change with the admin and the user it affected', async () => {
    adminApi.audit.mockResolvedValue({
      content: [
        {
          id: 'log-1',
          adminEmail: 'admin@x.com',
          action: 'TASK_DELETED',
          targetUserId: 'u1',
          taskId: 't1',
          taskTitle: 'Pay rent',
          createdAt: '2026-11-10T10:00:00',
        },
      ],
    });
    adminApi.users.mockResolvedValue([{ id: 'u1', name: 'Asha Rao', email: 'asha@x.com' }]);

    render(<ActivityPanel />);

    expect(await screen.findByText('deleted')).toBeInTheDocument();
    expect(screen.getByText('admin@x.com')).toBeInTheDocument();
    expect(screen.getByText('"Pay rent"')).toBeInTheDocument();
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
  });

  it('shows an empty message when no admin changes exist yet', async () => {
    adminApi.audit.mockResolvedValue({ content: [] });
    adminApi.users.mockResolvedValue([]);

    render(<ActivityPanel />);

    expect(await screen.findByText('No activity yet')).toBeInTheDocument();
  });

  it('shows the error when the activity cannot be loaded', async () => {
    adminApi.audit.mockRejectedValue(new Error('Forbidden'));
    adminApi.users.mockResolvedValue([]);

    render(<ActivityPanel />);

    expect(await screen.findByText('Could not load activity: Forbidden')).toBeInTheDocument();
  });
});
