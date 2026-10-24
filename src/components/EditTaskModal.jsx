import { useState } from 'react';

export default function EditTaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
  });

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate) return;
    onSave(task.id, { ...form, title: form.title.trim() });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Edit task</h2>

        <label>Title
          <input value={form.title} onChange={set('title')} maxLength={100} required />
        </label>

        <label>Description
          <textarea value={form.description} onChange={set('description')} rows={3} />
        </label>

        <div className="modal-row">
          <label>Priority
            <select value={form.priority} onChange={set('priority')}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>

          <label>Status
            <select value={form.status} onChange={set('status')}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </label>
        </div>

        <label>Due date
          <input type="date" value={form.dueDate} onChange={set('dueDate')} required />
        </label>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}