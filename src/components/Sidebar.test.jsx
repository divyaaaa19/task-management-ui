import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Sidebar from './Sidebar';

const user = { name: 'Divya Paluru', email: 'd@x.com' };

function renderSidebar(overrides = {}) {
  const handlers = {
    onSearch: vi.fn(),
    onLogout: vi.fn(),
    onOpenProfile: vi.fn(),
    onView: vi.fn(),
    ...overrides,
  };
  render(
    <Sidebar
      user={user}
      search=""
      view="tasks"
      isAdmin={false}
      {...handlers}
    />,
  );
  return handlers;
}

describe('Sidebar', () => {
  it('shows the user initials and details', () => {
    renderSidebar();

    const profile = screen.getByRole('button', { name: 'Open profile' });
    expect(profile).toHaveTextContent('DP');
    expect(profile).toHaveTextContent('Divya Paluru');
    expect(profile).toHaveTextContent('d@x.com');
  });

  it('hides the admin menu for a regular user', () => {
    renderSidebar({ isAdmin: false });

    expect(screen.queryByRole('button', { name: 'Users (Admin)' })).not.toBeInTheDocument();
  });

  it('shows the admin menu for an admin and switches to it', async () => {
    const userEventSetup = userEvent.setup();
    const { onView } = renderSidebar({ isAdmin: true });

    await userEventSetup.click(screen.getByRole('button', { name: 'Users (Admin)' }));

    expect(onView).toHaveBeenCalledWith('admin');
  });

  it('marks the current view as active', () => {
    renderSidebar({ isAdmin: true });

    expect(screen.getByRole('button', { name: 'Tasks' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'Users (Admin)' })).not.toHaveClass('active');
  });

  it('passes the search text up as the user types', () => {
    const { onSearch } = renderSidebar();

    fireEvent.change(screen.getByPlaceholderText('Search tasks'), {
      target: { value: 'milk' },
    });

    expect(onSearch).toHaveBeenCalledWith('milk');
  });

  it('opens the profile and logs out from the footer', async () => {
    const userEventSetup = userEvent.setup();
    const { onOpenProfile, onLogout } = renderSidebar();

    await userEventSetup.click(screen.getByRole('button', { name: 'Open profile' }));
    await userEventSetup.click(screen.getByRole('button', { name: 'Log out' }));

    expect(onOpenProfile).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
