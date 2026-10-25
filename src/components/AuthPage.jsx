import { useState } from 'react';
import { authApi } from '../api/taskApi';
import PasswordInput from './PasswordInput';

// A link from the reset email looks like /?reset=TOKEN
function readResetToken() {
  return new URLSearchParams(window.location.search).get('reset');
}

export default function AuthPage({ onAuthenticated }) {
  const [token] = useState(readResetToken);
  const [mode, setMode] = useState(() => (readResetToken() ? 'reset' : 'login'));
  const [form, setForm] = useState({
    name: '', email: '', mobile: '', identifier: '', password: '', confirm: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function switchMode(next) {
    setMode(next);
    setError('');
    setNotice('');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    try {
      if (mode === 'login') {
        const res = await authApi.login({ identifier: form.identifier, password: form.password });
        onAuthenticated(res);
      } else if (mode === 'signup') {
        const res = await authApi.register({
          name: form.name,
          email: form.email,
          mobile: form.mobile,
          password: form.password,
        });
        onAuthenticated(res);
      } else if (mode === 'forgot') {
        const res = await authApi.forgotPassword({ identifier: form.identifier });
        setNotice(res.message);
      } else if (mode === 'reset') {
        if (form.password !== form.confirm) throw new Error('Passwords do not match');
        const res = await authApi.resetPassword({ token, newPassword: form.password });
        window.history.replaceState({}, '', window.location.pathname);
        setForm((f) => ({ ...f, password: '', confirm: '' }));
        setNotice(res.message);
        setMode('login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const titles = {
    login: null,
    signup: null,
    forgot: 'Forgot password',
    reset: 'Set a new password',
  };

  const buttonText = {
    login: 'Log in',
    signup: 'Create account',
    forgot: 'Send reset link',
    reset: 'Reset password',
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="logo centered">
          <span className="logo-mark">✔</span> TaskFlow
        </div>

        {(mode === 'login' || mode === 'signup') && (
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'tab active' : 'tab'}
              onClick={() => switchMode('login')}
            >
              Log in
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'tab active' : 'tab'}
              onClick={() => switchMode('signup')}
            >
              Sign up
            </button>
          </div>
        )}

        {titles[mode] && <h2 className="auth-title">{titles[mode]}</h2>}

        {mode === 'signup' && (
          <>
            <label>
              Name
              <input value={form.name} onChange={set('name')} required />
            </label>
            <label>
              Email
              <input type="email" value={form.email} onChange={set('email')} required />
            </label>
            <label>
              Mobile number
              <input
                type="tel"
                value={form.mobile}
                onChange={set('mobile')}
                placeholder="+91 98765 43210"
                required
              />
            </label>
          </>
        )}

        {(mode === 'login' || mode === 'forgot') && (
          <label>
            Email or mobile number
            <input
              value={form.identifier}
              onChange={set('identifier')}
              autoComplete="username"
              required
            />
          </label>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <label>
            Password
            <PasswordInput
              value={form.password}
              onChange={set('password')}
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
        )}

        {mode === 'login' && (
          <button type="button" className="link forgot" onClick={() => switchMode('forgot')}>
            Forgot password?
          </button>
        )}

        {mode === 'reset' && (
          <>
            <label>
              New password
              <PasswordInput
                value={form.password}
                onChange={set('password')}
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirm password
              <PasswordInput
                value={form.confirm}
                onChange={set('confirm')}
                minLength={8}
                autoComplete="new-password"
              />
            </label>
          </>
        )}

        {notice && <div className="banner success">{notice}</div>}
        {error && <div className="banner error">{error}</div>}

        <button className="primary wide" disabled={busy}>
          {buttonText[mode]}
        </button>

        {mode === 'forgot' && (
          <button type="button" className="link" onClick={() => switchMode('login')}>
            ← Back to log in
          </button>
        )}
      </form>
    </div>
  );
}