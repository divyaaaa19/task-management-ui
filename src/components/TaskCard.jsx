export default function TaskCard({ task, onDragStart, onDelete, onEdit }) {
  const priority = task.priority.toLowerCase();

  return (
    <article className={`task-card ${priority}`} draggable onDragStart={onDragStart}>
      <div className="task-head">
        <h3>{task.title}</h3>
        <div className="card-actions">
          <button className="icon" onClick={() => onEdit(task)} aria-label="Edit task">✎</button>
          <button className="icon" onClick={() => onDelete(task.id)} aria-label="Delete task">✕</button>
        </div>
      </div>

      {task.description && <p className="desc">{task.description}</p>}

      <div className="task-foot">
        <span className={`badge ${priority}`}>{task.priority}</span>
        <span>📅 {task.dueDate}</span>
      </div>
    </article>
  );
}