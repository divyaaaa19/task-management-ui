import { useState } from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
  { key: 'TODO', title: 'To Do', tone: 'todo' },
  { key: 'IN_PROGRESS', title: 'In Progress', tone: 'progress' },
  { key: 'DONE', title: 'Done', tone: 'done' },
];

export default function TaskBoard({ tasks, onMove, onAdd, onEdit, onDelete }) {
  const [draggedId, setDraggedId] = useState(null);
  const [overColumn, setOverColumn] = useState(null);

  function drop(status) {
    const task = tasks.find((t) => t.id === draggedId);
    if (task && task.status !== status) onMove(task.id, status);
    setDraggedId(null);
    setOverColumn(null);
  }

  return (
    <div className="board">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.key);
        return (
          <section
            key={col.key}
            className={`column ${overColumn === col.key ? 'drop-target' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setOverColumn(col.key);
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={() => drop(col.key)}
          >
            <header className={`column-head ${col.tone}`}>
              <span>
                {col.title} <em>{items.length}</em>
              </span>
              <button
                className="plus"
                onClick={() => onAdd(col.key)}
                aria-label={`Add task to ${col.title}`}
              >
                +
              </button>
            </header>

            <div className="column-body">
              {items.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onDragStart={() => setDraggedId(task.id)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              {items.length === 0 && <p className="empty">Drop tasks here</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}