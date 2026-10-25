import { useEffect, useState } from 'react';
import { profileApi } from '../api/taskApi';

const toForm = (p) => ({ name: p.name, email: p.email, mobile: p.mobile || '' });

function initials(name = '') {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

export default function ProfileModal({ onClose, onUpdated }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    profileApi
      .get()
      .then((p) => {
        setProfile(p);
        setForm(toForm(p));
      })
      .catch((err) => setError(err.message));
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function startEdit() {
    setForm(toForm(profile));
    setEditing(true);
    setError('');
    setMessage('');
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const updated = await profileApi.update(form);
      setProfile(updated);
      setEditing(false);
      setMessage('Profile updated');
      onUpdated({ name: updated.name, email: updated.email });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const memberSince =
    profile?.createdAt &&
    new Date(profile.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-head">
          <div className="avatar big">{initials(profile?.name)}</div>
          <div>
            <h2>{profile?.name ?? 'Profile'}</h2>
            {memberSince && <small className="muted">Member since {memberSince}</small>}
          </div>
        </div>

        {!profile && !error && <p className="muted">Loading…</p>}

        {profile && !editing && (
          <>
            <dl className="details">
              <dt>Name</dt>
              <dd>{profile.name}</dd>
              <dt>Email</dt>
              <dd>{profile.email}</dd>
              <dt>Mobile</dt>
              <dd>{profile.mobile || 'Not added yet'}</dd>
            </dl>

            {message && <div className="banner success">{message}</div>}

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onClose}>Close</button>
              <button type="button" className="primary" onClick={startEdit}>Edit profile</button>
            </div>
          </>
        )}

        {profile && editing && (
          <form className="profile-form" onSubmit={save}>
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
              <input type="tel" value={form.mobile} onChange={set('mobile')} placeholder="+91 98765 43210" required />
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="primary" disabled={busy}>
                Save changes
              </button>
            </div>
          </form>
        )}

        {error && <div className="banner error">{error}</div>}
      </div>
    </div>
  );
}