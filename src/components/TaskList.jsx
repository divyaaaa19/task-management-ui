import TaskItem from './TaskItem';

export default function TaskList({
  tasks,
  loading,
  error,
  onToggle,
  onDelete,
  onEdit,
}) {
  if (loading) return <p className="state-message">Loading tasks...</p>;
  if (error) return <p className="state-message error">{error}</p>;
  if (tasks.length === 0) {
    return <p className="state-message">📭 No tasks here yet.</p>;
  }

  return (
    <div className="tasks-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}