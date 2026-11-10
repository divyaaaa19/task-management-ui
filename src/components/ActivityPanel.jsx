import { useEffect, useState } from 'react';
import { adminApi } from '../api/taskApi';

const ACTION_LABEL = {
  TASK_CREATED: { text: 'created', className: 'created' },
  TASK_UPDATED: { text: 'updated', className: 'updated' },
  TASK_DELETED: { text: 'deleted', className: 'deleted' },
};

function formatWhen(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ActivityPanel() {
  const [entries, setEntries] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([adminApi.audit(), adminApi.users()])
      .then(([page, users]) => {
        if (cancelled) return;
        setEntries(page.content);
        setNames(Object.fromEntries(users.map((u) => [u.id, u.name])));
      })
      .catch((err) => {
        if (!cancelled) setError(`Could not load activity: ${err.message}`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Activity</h1>
          <p className="subtitle">Every change admins make to a user's tasks</p>
        </div>
      </header>

      {error && <div className="banner error">{error}</div>}
      {loading && <p className="muted">Loading…</p>}

      {!loading && !error && entries.length === 0 && (
        <div className="empty-state">
          <h2>No activity yet</h2>
          <p>Changes admins make to a user's tasks will appear here.</p>
        </div>
      )}

      <ul className="activity-list">
        {entries.map((e) => {
          const label = ACTION_LABEL[e.action] ?? { text: e.action, className: '' };
          return (
            <li className="activity-item" key={e.id}>
              <span className={`activity-badge ${label.className}`}>{label.text}</span>
              <div className="activity-text">
                <strong>{e.adminEmail}</strong> {label.text}{' '}
                {e.taskTitle ? <em>"{e.taskTitle}"</em> : 'a task'} for{' '}
                <strong>{names[e.targetUserId] ?? 'a user'}</strong>
              </div>
              <time className="activity-time" dateTime={e.createdAt}>
                {formatWhen(e.createdAt)}
              </time>
            </li>
          );
        })}
      </ul>
    </>
  );
}
