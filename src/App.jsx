import { useCallback, useEffect, useState } from 'react';
import { taskApi } from './api/taskApi';
import TaskForm from './components/TaskForm';
import FilterBar from './components/FilterBar';
import TaskBoard from './components/TaskBoard';
import EditTaskModal from './components/EditTaskModal';
import './App.css';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const refresh = useCallback(async () => {
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
  }, [search, priority]);

  // Debounced reload when search or priority changes
  useEffect(() => {
    const timer = setTimeout(refresh, 300);
    return () => clearTimeout(timer);
  }, [refresh]);

  async function run(action, successMessage) {
    try {
      await action();
      showToast(successMessage);
      refresh();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const handleCreate = (task) => run(() => taskApi.create(task), 'Task created');

  const handleMove = (id, status) =>
    run(() => taskApi.update(id, { status }), 'Task moved');

  const handleEdit = (id, changes) => {
    setEditing(null);
    return run(() => taskApi.update(id, changes), 'Task saved');
  };

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

  const stats = summary && [
    ['Total', summary.total],
    ['To Do', summary.todo],
    ['In Progress', summary.inProgress],
    ['Done', summary.done],
    ['Overdue', summary.overdue],
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">✅ TaskFlow</div>
        <FilterBar
          search={search}
          onSearch={setSearch}
          priority={priority}
          onPriority={setPriority}
        />
      </header>

      <div className="summary">
        {stats?.map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{value}</span>
            {label}
          </div>
        ))}
        <button onClick={handleRollover}>Roll over overdue</button>
      </div>

      <TaskForm onCreate={handleCreate} />

      {error && <div className="banner error">{error}</div>}

      {loading && tasks.length === 0 ? (
        <p className="empty">Loading…</p>
      ) : (
        <TaskBoard
          tasks={tasks}
          onMove={handleMove}
          onDelete={handleDelete}
          onEdit={setEditing}
        />
      )}

      {editing && (
        <EditTaskModal
          task={editing}
          onSave={handleEdit}
          onClose={() => setEditing(null)}
        />
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}