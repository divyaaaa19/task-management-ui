import { useState } from 'react';
import TaskCard from './TaskCard';

const COLUMNS = [
    { key: 'TODO', title: 'To Do' },
    { key: 'IN_PROGRESS', title: 'In Progress' },
    { key: 'DONE', title: 'Done' },
];

export default function TaskBoard({ tasks, onMove, onDelete, onEdit }) {
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
                        <header>
                            <h2>{col.title}</h2>
                            <span className="count">{items.length}</span>
                        </header>

                        {items.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onDragStart={() => setDraggedId(task.id)}
                                onDelete={onDelete}
                                onEdit={onEdit}
                            />
                        ))}

                        {items.length === 0 && <p className="empty">Drop tasks here</p>}
                    </section>
                );
            })}
        </div>
    );
}