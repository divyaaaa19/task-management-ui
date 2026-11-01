import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api/taskApi';
import TaskBoard from './TaskBoard';
import TaskModal from './TaskModal';

function initials(name = '') {
  return name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
}

export default function AdminPanel({ onToast }) {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { status } to create, { task } to edit

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      setUsers(await adminApi.users());
      setError('');
    } catch (err) {
      setError(`Could not load users: ${err.message}`);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  const loadTasks = useCallback(async (userId) => {
    setTasksLoading(true);
    try {
      const page = await adminApi.tasks(userId);
      setTasks(page.content);
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

  const search = query.trim().toLowerCase();
  const shownUsers = users.filter(
    (u) => !search || `${u.name} ${u.email}`.toLowerCase().includes(search),
  );

  return (
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

        {shownUsers.map((u) => (
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
            </div>
          </button>
        ))}
      </aside>

      <section className="admin-main">
        {error && <div className="banner error">{error}</div>}

        {!selected ? (
          <p className="muted">Select a user to view and manage their tasks.</p>
        ) : (
          <>
            <header className="page-header">
              <h1>{`${selected.name}'s tasks`}</h1>
              <div className="page-actions">
                <button className="primary" onClick={() => setModal({ status: 'TODO' })}>
                  + Add Task
                </button>
              </div>
            </header>

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

      {modal && (
        <TaskModal
          task={modal.task}
          defaultStatus={modal.status}
          onSave={(data) => handleSave(modal.task?.id, data)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
