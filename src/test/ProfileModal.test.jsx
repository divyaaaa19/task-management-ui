import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileModal from '../components/ProfileModal';
import { profileApi } from '../api/taskApi';

vi.mock('../api/taskApi', () => ({
  profileApi: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

const profile = {
  name: 'Divya Paluru',
  email: 'd@x.com',
  mobile: '+91 98765 43210',
  createdAt: '2026-01-15T10:00:00Z',
};

describe('ProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the saved profile details', async () => {
    profileApi.get.mockResolvedValue(profile);

    render(<ProfileModal onClose={vi.fn()} onUpdated={vi.fn()} />);

    expect(await screen.findByText('+91 98765 43210')).toBeInTheDocument();
    expect(screen.getByText('d@x.com')).toBeInTheDocument();
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
  });

  it('says when no mobile number has been added', async () => {
    profileApi.get.mockResolvedValue({ ...profile, mobile: '' });

    render(<ProfileModal onClose={vi.fn()} onUpdated={vi.fn()} />);

    expect(await screen.findByText('Not added yet')).toBeInTheDocument();
  });

  it('saves edited details and reports the update', async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    profileApi.get.mockResolvedValue(profile);
    profileApi.update.mockResolvedValue({ ...profile, name: 'Divya P' });

    render(<ProfileModal onClose={vi.fn()} onUpdated={onUpdated} />);
    await user.click(await screen.findByRole('button', { name: 'Edit profile' }));

    const name = screen.getByLabelText('Name');
    await user.clear(name);
    await user.type(name, 'Divya P');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(profileApi.update).toHaveBeenCalledWith({
      name: 'Divya P',
      email: 'd@x.com',
      mobile: '+91 98765 43210',
    });
    expect(onUpdated).toHaveBeenCalledWith({ name: 'Divya P', email: 'd@x.com' });
    expect(await screen.findByText('Profile updated')).toBeInTheDocument();
  });

  it('discards changes when editing is cancelled', async () => {
    const user = userEvent.setup();
    profileApi.get.mockResolvedValue(profile);

    render(<ProfileModal onClose={vi.fn()} onUpdated={vi.fn()} />);
    await user.click(await screen.findByRole('button', { name: 'Edit profile' }));
    await user.type(screen.getByLabelText('Name'), ' Changed');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(profileApi.update).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
  });

  it('shows the error when the update fails', async () => {
    const user = userEvent.setup();
    profileApi.get.mockResolvedValue(profile);
    profileApi.update.mockRejectedValue(new Error('Email already in use'));

    render(<ProfileModal onClose={vi.fn()} onUpdated={vi.fn()} />);
    await user.click(await screen.findByRole('button', { name: 'Edit profile' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText('Email already in use')).toBeInTheDocument();
  });

  it('shows the error when the profile cannot be loaded', async () => {
    profileApi.get.mockRejectedValue(new Error('Server unavailable'));

    render(<ProfileModal onClose={vi.fn()} onUpdated={vi.fn()} />);

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
  });
});
