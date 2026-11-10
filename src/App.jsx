import { useCallback, useEffect, useRef, useState } from 'react';
import { taskApi, session, roleFromToken } from './api/taskApi';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import TaskBoard from './components/TaskBoard';
import TaskModal from './components/TaskModal';
import './App.css';
import ProfileModal from './components/ProfileModal';
import AdminPanel from './components/AdminPanel';
import ProgressBar from './components/ProgressBar';
import ActivityPanel from './components/ActivityPanel';
import ConfirmDialog from './components/ConfirmDialog';
import TaskSkeleton from './components/TaskSkeleton';
import ListView from './components/ListView';
import CalendarView from './components/CalendarView';
import useUndoableDelete from './hooks/useUndoableDelete';
import { filterTasks, sortTasks } from './utils/taskFilters';

const LAYOUTS = [
  ['board', 'Board'],
  ['list', 'List'],
  ['calendar', 'Calendar'],
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function App() {
  const [auth, setAuth] = useState(() => session.get());
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [due, setDue] = useState('all'); // 'all' | 'today' | 'overdue'
  const [sort, setSort] = useState('due'); // 'due' | 'priority' | 'newest'
  const [layout, setLayout] = useState('board'); // 'board' | 'list' | 'calendar'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const [modal, setModal] = useState(null); // { status } to create, { task } to edit
  const [confirmTask, setConfirmTask] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [view, setView] = useState('tasks'); // 'tasks', 'admin' or 'activity'

  // options: { duration, action: { label, onClick } } for toasts that need a button
  const showToast = (message, type = 'success', { duration = 3000, action } = {}) => {
    clearTimeout(toastTimer.current);
    setToast({ message, type, action });
    toastTimer.current = setTimeout(() => setToast(null), duration);
  };

  const deletion = useUndoableDelete(showToast);

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

  // Asks first; the delete itself waits in the undo window after confirming
  const handleDelete = (id) => {
    const task = tasks.find((t) => t.id === id);
    if (task) setConfirmTask(task);
  };

  const confirmDelete = () => {
    const task = confirmTask;
    setConfirmTask(null);
    deletion.scheduleDelete({
      task,
      remove: (t) => taskApi.remove(t.id),
      onDone: refresh,
    });
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

  const isAdmin = roleFromToken(auth.token) === 'ADMIN';
  const showAdmin = isAdmin && view === 'admin';
  const showActivity = isAdmin && view === 'activity';

  const stats = summary && [
    ['Total', summary.total],
    ['To Do', summary.todo],
    ['In Progress', summary.inProgress],
    ['Done', summary.done],
    ['Overdue', summary.overdue],
  ];

  // Tasks waiting in the undo window are hidden; the rest are filtered and sorted
  const visible = sortTasks(
    filterTasks(tasks.filter((t) => !deletion.hiddenIds.has(t.id)), due),
    sort,
  );

  const handlers = {
    onEdit: (task) => setModal({ task }),
    onDelete: handleDelete,
  };

  return (
    <div className="layout">
      <Sidebar
        user={auth.user}
        search={search}
        onSearch={setSearch}
        onLogout={logout}
        onOpenProfile={() => setShowProfile(true)}
        view={view}
        onView={setView}
        isAdmin={isAdmin}
      />

      <main className="main">
        {showAdmin ? (
          <AdminPanel onToast={showToast} />
        ) : showActivity ? (
          <ActivityPanel />
        ) : (
          <>
        <header className="page-header">
          <div>
            <h1>Tasks</h1>
            <p className="subtitle">
              {greeting()}, {auth.user.name.split(' ')[0]}
            </p>
          </div>
          <div className="page-actions">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} aria-label="Priority">
              <option value="">All priorities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
            <select value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date">
              <option value="all">Any due date</option>
              <option value="today">Due today</option>
              <option value="overdue">Overdue only</option>
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
              <option value="due">Sort: due date</option>
              <option value="priority">Sort: priority</option>
              <option value="newest">Sort: newest</option>
            </select>
            <div className="segmented" role="group" aria-label="Layout">
              {LAYOUTS.map(([key, label]) => (
                <button
                  key={key}
                  className={layout === key ? 'active' : ''}
                  aria-pressed={layout === key}
                  onClick={() => setLayout(key)}
                >
                  {label}
                </button>
              ))}
            </div>
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

        {summary && <ProgressBar done={summary.done} total={summary.total} />}

        {error && <div className="banner error">{error}</div>}

        {loading && tasks.length === 0 ? (
          <TaskSkeleton />
        ) : layout === 'list' ? (
          <ListView tasks={visible} {...handlers} />
        ) : layout === 'calendar' ? (
          <CalendarView tasks={visible} onEdit={handlers.onEdit} />
        ) : (
          <TaskBoard
            tasks={visible}
            onMove={handleMove}
            onAdd={(status) => setModal({ status })}
            onEdit={handlers.onEdit}
            onDelete={handlers.onDelete}
          />
        )}
          </>
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

      {confirmTask && (
        <ConfirmDialog
          title="Delete this task?"
          message={`"${confirmTask.title}" will be removed in a few seconds. You can undo before then.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setConfirmTask(null)}
        />
      )}

      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          <span>{toast.message}</span>
          {toast.action && (
            <button className="toast-action" onClick={toast.action.onClick}>
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onUpdated={(user) => {
            session.setUser(user);
            setAuth(session.get());
          }}
        />
      )}
    </div>
  );
}
