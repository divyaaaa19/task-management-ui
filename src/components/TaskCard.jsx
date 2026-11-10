const PRIORITY_LABEL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });
}

// Overdue = due before today (local date) and not done
function isOverdue(task) {
  if (task.status === 'DONE') return false;
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const today = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return task.dueDate < today;
}

export default function TaskCard({ task, onDragStart, onEdit, onDelete }) {
  const priority = task.priority.toLowerCase();
  const overdue = isOverdue(task);

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
        <span className="pill date">◷ {formatDate(task.dueDate)}</span>
      </div>
    </article>
  );
}