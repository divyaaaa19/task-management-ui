import TimeLeft from './TimeLeft';
import { timeLeft } from '../utils/taskFilters';

const PRIORITY_LABEL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

export default function TaskCard({ task, onDragStart, onEdit, onDelete }) {
  const priority = task.priority.toLowerCase();
  const overdue = Boolean(timeLeft(task)?.overdue);

  return (
    <article className={`task-card${overdue ? ' overdue' : ''}`} draggable onDragStart={onDragStart}>
      <div className="task-top">
        <span className="label">#{task.id.slice(-5)}</span>
        <div className="card-actions">
          <button className="icon" onClick={() => onEdit(task)} aria-label="Edit task">✎</button>
          <button className="icon" onClick={() => onDelete(task.id)} aria-label="Delete task">✕</button>
        </div>
      </div>

      <h3>{task.title}</h3>
      {task.description && <p className="desc">{task.description}</p>}

      <div className="task-foot">
        <span className={`pill ${priority}`}>⚑ {PRIORITY_LABEL[task.priority]}</span>
        {overdue && <span className="pill overdue">Overdue</span>}
        <TimeLeft task={task} />
      </div>
    </article>
  );
}
