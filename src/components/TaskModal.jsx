import { useState } from 'react';

export default function TaskModal({ task, defaultStatus = 'TODO', onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    priority: task?.priority ?? 'MEDIUM',
    status: task?.status ?? defaultStatus,
    dueDate: task?.dueDate ?? '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate) return;
    onSave({ ...form, title: form.title.trim() });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{task ? 'Edit task' : 'New task'}</h2>

        <label>
          Title
          <input value={form.title} onChange={set('title')} maxLength={100} required />
        </label>

        <label>
          Description
          <textarea rows={3} value={form.description} onChange={set('description')} />
        </label>

        <div className="modal-row">
          <label>
            Priority
            <select value={form.priority} onChange={set('priority')}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>

          <label>
            Status
            <select value={form.status} onChange={set('status')}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </label>
        </div>

        <label>
          Due date
          <input type="date" value={form.dueDate} onChange={set('dueDate')} required />
        </label>

        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary">
            {task ? 'Save' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}