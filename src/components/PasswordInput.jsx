import { useState } from 'react';

export default function PasswordInput({ value, onChange, placeholder, minLength, autoComplete }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength={minLength}
        autoComplete={autoComplete}
        required
      />
      <button
        type="button"
        className="eye"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? '🙈' : '👁'}
      </button>
    </div>
  );
}