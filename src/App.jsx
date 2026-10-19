import { useCallback, useEffect, useState } from 'react';
import { taskApi } from './api/taskApi';
import TaskForm from './components/TaskForm';
import FilterBar from './components/FilterBar';
import TaskList from './components/TaskList';
import './App.css';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = search.trim()
        ? await taskApi.search(search.trim())
        : await taskApi.getAll();
      setTasks(data);
    } catch (err) {
      setError(`Could not reach the API: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(loadTasks, 300);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  async function handleCreate(task) {
    try {
      await taskApi.create(task);
      showToast('Task created');
      loadTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleToggle(id, completed) {
    try {
      await taskApi.update(id, { completed });
      showToast('Task updated');
      loadTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleEdit(id, changes) {
    try {
      await taskApi.update(id, changes);
      showToast('Task saved');
      loadTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskApi.remove(id);
      showToast('Task deleted');
      loadTasks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  const visibleTasks = tasks.filter((task) => {
    if (filter === 'all') return true;
    return filter === 'completed' ? !!task.completed : !task.completed;
  });

  return (
    <div className="container">
      <header>
        <h1>📝 Task Manager</h1>
        <p className="subtitle">Stay on top of your work</p>
      </header>

      <TaskForm onCreate={handleCreate} />

      <section className="card">
        <div className="section-header">
          <h2>Your tasks</h2>
          <span className="counter">
            {visibleTasks.length} task{visibleTasks.length === 1 ? '' : 's'}
          </span>
        </div>

        <FilterBar
          filter={filter}
          onChange={setFilter}
          search={search}
          onSearchChange={setSearch}
        />

        <TaskList
          tasks={visibleTasks}
          loading={loading}
          error={error}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </section>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}