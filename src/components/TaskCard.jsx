const PRIORITY_LABEL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };

function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
  });
}

export default function TaskCard({ task, onDragStart, onEdit, onDelete }) {
  const priority = task.priority.toLowerCase();

  return (
    <article className="task-card" draggable onDragStart={onDragStart}>
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
        <span className="pill date">◷ {formatDate(task.dueDate)}</span>
      </div>
    </article>
  );
}