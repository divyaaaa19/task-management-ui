import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/taskApi';
import TaskBoard from './TaskBoard';
import TaskModal from './TaskModal';

function initials(name = '') {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

// Local date as yyyy-mm-dd, the same format as dueDate
function todayString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Same rules as the API summary: overdue = due before today and not done
function summarize(tasks) {
  const today = todayString();
  const s = { total: tasks.length, todo: 0, inProgress: 0, done: 0, overdue: 0 };
  for (const t of tasks) {
    if (t.status === 'TODO') s.todo++;
    else if (t.status === 'IN_PROGRESS') s.inProgress++;
    else if (t.status === 'DONE') s.done++;
    if (t.status !== 'DONE' && t.dueDate < today) s.overdue++;
  }
  return s;
}

export default function AdminPanel({ onToast }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [stats, setStats] = useState({}); // userId -> summary
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { status } to create, { task } to edit
  const [bulkOpen, setBulkOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Loads every user's tasks once so each card can show its counts
  const loadStats = useCallback(async (list) => {
    const results = await Promise.allSettled(list.map((u) => adminApi.tasks(u.id)));
    const next = {};
    list.forEach((u, i) => {
      if (results[i].status === 'fulfilled') next[u.id] = summarize(results[i].value.content);
    });
    setStats(next);
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const list = await adminApi.users();
      setUsers(list);
      await loadStats(list);
      setError('');
    } catch (err) {
      setError(`Could not load users: ${err.message}`);
    } finally {
      setUsersLoading(false);
    }
  }, [loadStats]);

  const loadTasks = useCallback(async (userId) => {
    setTasksLoading(true);
    try {
      const page = await adminApi.tasks(userId);
      setTasks(page.content);
      setStats((prev) => ({ ...prev, [userId]: summarize(page.content) }));
      setError('');
    } catch (err) {
      setTasks([]);
      setError(`Could not load tasks: ${err.message}`);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function selectUser(user) {
    setSelected(user);
    loadTasks(user.id);
  }

  async function run(action, message) {
    try {
      await action();
      onToast(message);
      await loadTasks(selected.id);
    } catch (err) {
      onToast(err.message, 'error');
    }
  }

  const handleSave = (id, data) => {
    setModal(null);
    return id
      ? run(() => adminApi.update(selected.id, id, data), 'Task saved')
      : run(() => adminApi.create(selected.id, data), 'Task created');
  };

  const handleMove = (id, status) =>
    run(() => adminApi.update(selected.id, id, { status }), 'Task moved');

  const handleDelete = (id) => {
    if (!window.confirm('Delete this task?')) return;
    run(() => adminApi.remove(selected.id, id), 'Task deleted');
  };

  // Creates the same task for every user, one request per user
  async function addToAllUsers(data) {
    setBulkOpen(false);
    if (!window.confirm(`Create "${data.title}" for all ${users.length} users?`)) return;

    setBusy(true);
    let ok = 0;
    let failed = 0;
    for (const u of users) {
      try {
        await adminApi.create(u.id, data);
        ok++;
      } catch {
        failed++;
      }
    }
    setBusy(false);

    onToast(
      failed ? `Added to ${ok} users, ${failed} failed` : `Added to all ${ok} users`,
      failed ? 'error' : 'success',
    );
    loadStats(users);
    if (selected) loadTasks(selected.id);
  }

  const search = query.trim().toLowerCase();
  const shownUsers = users.filter(
    (u) => !search || `${u.name} ${u.email}`.toLowerCase().includes(search),
  );
  const selectedSummary = summarize(tasks);

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Users</h1>
          <p className="subtitle">Manage any user's tasks</p>
        </div>
        <div className="page-actions">
          <button
            className="outline"
            onClick={() => setBulkOpen(true)}
            disabled={busy || users.length === 0}
          >
            {busy ? 'Adding…' : 'Add task to all users'}
          </button>
        </div>
      </header>

      <div className="admin">
        <aside className="user-list">
          <input
            className="search"
            type="search"
            placeholder="Search users"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {usersLoading && <p className="muted">Loading users…</p>}
          {!usersLoading && shownUsers.length === 0 && <p className="muted">No users found</p>}

          {shownUsers.map((u) => {
            const s = stats[u.id];
            return (
              <button
                key={u.id}
                className={`user-row ${selected?.id === u.id ? 'active' : ''}`}
                onClick={() => selectUser(u)}
              >
                <div className="avatar">{initials(u.name)}</div>
                <div className="user-meta">
                  <strong>
                    {u.name}
                    {u.role === 'ADMIN' && <span className="role-badge">Admin</span>}
                  </strong>
                  <small>{u.email}</small>
                  {s && (
                    <div className="user-chips">
                      <span className="chip">{s.total} tasks</span>
                      {s.overdue > 0 && <span className="chip overdue">{s.overdue} overdue</span>}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        <section className="admin-main">
          {error && <div className="banner error">{error}</div>}

          {!selected ? (
            <div className="empty-state">
              <h2>No user selected</h2>
              <p>Choose a user on the left to view and manage their tasks.</p>
            </div>
          ) : (
            <>
              <div className="user-hero">
                <div className="avatar big">{initials(selected.name)}</div>
                <div className="user-hero-text">
                  <h2>{selected.name}</h2>
                  <small>{selected.email}</small>
                </div>
                <div className="page-actions">
                  <button className="primary" onClick={() => setModal({ status: 'TODO' })}>
                    + Add Task
                  </button>
                </div>
              </div>

              <div className="summary">
                {[
                  ['Total', selectedSummary.total],
                  ['To Do', selectedSummary.todo],
                  ['In Progress', selectedSummary.inProgress],
                  ['Done', selectedSummary.done],
                  ['Overdue', selectedSummary.overdue],
                ].map(([label, value]) => (
                  <div className="stat" key={label}>
                    <span>{value}</span>
                    {label}
                  </div>
                ))}
              </div>

              {tasksLoading && tasks.length === 0 ? (
                <p className="muted">Loading…</p>
              ) : (
                <TaskBoard
                  tasks={tasks}
                  onMove={handleMove}
                  onAdd={(status) => setModal({ status })}
                  onEdit={(task) => setModal({ task })}
                  onDelete={handleDelete}
                />
              )}
            </>
          )}
        </section>
      </div>

      {modal && (
        <TaskModal
          task={modal.task}
          defaultStatus={modal.status}
          onSave={(data) => handleSave(modal.task?.id, data)}
          onClose={() => setModal(null)}
        />
      )}

      {bulkOpen && (
        <TaskModal
          heading="New task for all users"
          submitLabel={`Create for ${users.length} users`}
          onSave={addToAllUsers}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </>
  );
}
