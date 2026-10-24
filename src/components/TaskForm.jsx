import { useState } from 'react';

const EMPTY = { title: '', description: '', priority: 'MEDIUM', dueDate: '' };

export default function TaskForm({ onCreate }) {
  const [form, setForm] = useState(EMPTY);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.dueDate) return;
    onCreate({ ...form, title: form.title.trim() });
    setForm(EMPTY);
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <input
        placeholder="Task title"
        value={form.title}
        onChange={set('title')}
        maxLength={100}
        required
      />
      <input
        placeholder="Description (optional)"
        value={form.description}
        onChange={set('description')}
      />
      <select value={form.priority} onChange={set('priority')}>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
      </select>
      <input type="date" value={form.dueDate} onChange={set('dueDate')} required />
      <button type="submit">Add task</button>
    </form>
  );
}