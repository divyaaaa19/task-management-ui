import { useState } from 'react';

function formatDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return isNaN(date)
    ? value
    : date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

export default function TaskItem({ task, onToggle, onDelete, onEdit }) {
  const completed = !!task.completed;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');

  function startEditing() {
    setTitle(task.title);
    setDescription(task.description || '');
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await onEdit(task.id, { title: trimmed, description: description.trim() });
    setEditing(false);
  }

  if (editing) {
    return (
      <form className="task-item editing" onSubmit={handleSave}>
        <div className="task-content">
          <input
            type="text"
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="task-actions">
          <button type="submit" className="btn-small btn-complete">Save</button>
          <button
            type="button"
            className="btn-small btn-cancel"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={`task-item ${completed ? 'completed' : ''}`}>
      <div className="task-content">
        <div className="task-title">{task.title}</div>
        {task.description && (
          <div className="task-description">{task.description}</div>
        )}
        <div className="task-time">📅 {formatDate(task.createdAt)}</div>
      </div>

      <div className="task-actions">
        <button
          className="btn-small btn-complete"
          onClick={() => onToggle(task.id, !completed)}
        >
          {completed ? '↩ Undo' : '✓ Complete'}
        </button>
        <button className="btn-small btn-edit" onClick={startEditing}>
          ✏️ Edit
        </button>
        <button className="btn-small btn-delete" onClick={() => onDelete(task.id)}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}