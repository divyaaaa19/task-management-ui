import { useCallback, useEffect, useState } from 'react';
import { taskApi, session } from './api/taskApi';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import './App.css';

export default function App() {
  const [auth, setAuth] = useState(() => session.get());
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // { status } to create, { task } to edit

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logout = useCallback(() => {
    session.clear();
    setAuth(null);
    setTasks([]);
    setSummary(null);
  }, []);

  // Set by the API layer when a saved token is rejected
  useEffect(() => {
    window.addEventListener('session-expired', logout);
    return () => window.removeEventListener('session-expired', logout);
  }, [logout]);

  const refresh = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    setError('');
    try {
      const [page, stats] = await Promise.all([
        taskApi.list({ search, priority }),
        taskApi.summary(),
      ]);
      setTasks(page.content);
      setSummary(stats);
    } catch (err) {
      setError(`Could not load tasks: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [auth, search, priority]);

  useEffect(() => {
    const timer = setTimeout(refresh, 300);
    return () => clearTimeout(timer);
  }, [refresh]);

  async function run(action, message) {
    try {
      await action();
      showToast(message);
      refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const handleSave = (id, data) => {
    setModal(null);
    return id
      ? run(() => taskApi.update(id, data), 'Task saved')
      : run(() => taskApi.create(data), 'Task created');
  };

  const handleMove = (id, status) =>
    run(() => taskApi.update(id, { status }), 'Task moved');

  const handleDelete = (id) => {
    if (!window.confirm('Delete this task?')) return;
    run(() => taskApi.remove(id), 'Task deleted');
  };

  const handleRollover = async () => {
    try {
      const { rolledOver } = await taskApi.rollover();
      showToast(`${rolledOver} overdue task(s) moved to today`);
      refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!auth) {
    return (
      <AuthPage
        onAuthenticated={(res) => {
          session.save(res);
          setAuth(session.get());
        }}
      />
    );
  }

  const stats = summary && [
    ['Total', summary.total],
    ['To Do', summary.todo],
    ['In Progress', summary.inProgress],
    ['Done', summary.done],
    ['Overdue', summary.overdue],
  ];

  return (
    <div className="layout">
      <Sidebar
        user={auth.user}
        search={search}
        onSearch={setSearch}
        onLogout={logout}
      />

      <main className="main">
        <header className="page-header">
          <h1>Tasks</h1>
          <div className="page-actions">
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <button className="outline" onClick={handleRollover}>Roll over overdue</button>
            <button className="primary" onClick={() => setModal({ status: 'TODO' })}>
              + Add Task
            </button>
          </div>
        </header>

        {stats && (
          <div className="summary">
            {stats.map(([label, value]) => (
              <div className="stat" key={label}>
                <span>{value}</span>
                {label}
              </div>
            ))}
          </div>
        )}

        {error && <div className="banner error">{error}</div>}

        {loading && tasks.length === 0 ? (
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
      </main>

      {modal && (
        <TaskModal
          task={modal.task}
          defaultStatus={modal.status}
          onSave={(data) => handleSave(modal.task?.id, data)}
          onClose={() => setModal(null)}
        />
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}