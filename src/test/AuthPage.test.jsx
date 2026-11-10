import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AuthPage from '../components/AuthPage';
import { authApi } from '../api/taskApi';

vi.mock('../api/taskApi', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

describe('AuthPage login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs in with the entered email and password', async () => {
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();
    const response = { token: 'abc', name: 'Divya', email: 'divya@example.com' };
    authApi.login.mockResolvedValue(response);

    render(<AuthPage onAuthenticated={onAuthenticated} />);
    await user.type(screen.getByLabelText(/email or mobile number/i), 'divya@example.com');
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'secret123');
    await user.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1));

    expect(authApi.login).toHaveBeenCalledWith({
      identifier: 'divya@example.com',
      password: 'secret123',
    });
    expect(onAuthenticated).toHaveBeenCalledWith(response);
  });

  it('shows the API error when login fails', async () => {
    const user = userEvent.setup();
    const onAuthenticated = vi.fn();
    authApi.login.mockRejectedValue(new Error('Invalid email/mobile or password'));

    render(<AuthPage onAuthenticated={onAuthenticated} />);
    await user.type(screen.getByLabelText(/email or mobile number/i), 'divya@example.com');
    await user.type(screen.getByLabelText(/^password/i, { selector: 'input' }), 'wrong');
    await user.click(screen.getAllByRole('button', { name: 'Log in' }).at(-1));

    expect(await screen.findByText('Invalid email/mobile or password')).toBeInTheDocument();
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
