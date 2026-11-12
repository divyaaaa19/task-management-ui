import TimeLeft from './TimeLeft';
import { timeLeft } from '../utils/taskFilters';

const PRIORITY_LABEL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const STATUS_LABEL = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Plain list of tasks, easier to scan on phones than the board
export default function ListView({ tasks, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <h2>No tasks here</h2>
        <p>Try a different filter, or add a new task.</p>
      </div>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li className={`task-row${timeLeft(task)?.overdue ? ' overdue' : ''}`} key={task.id}>
          <div className="task-row-main">
            <strong>{task.title}</strong>
            {task.description && <small>{task.description}</small>}
          </div>
          <span className={`pill ${task.priority.toLowerCase()}`}>{PRIORITY_LABEL[task.priority]}</span>
          <span className="status-tag">{STATUS_LABEL[task.status]}</span>
          <TimeLeft task={task} />
          <span className="pill date">{formatDate(task.dueDate)}</span>
          <div className="card-actions">
            <button className="icon" onClick={() => onEdit(task)} aria-label="Edit task">✎</button>
            <button className="icon" onClick={() => onDelete(task.id)} aria-label="Delete task">✕</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
