export default function FilterBar({ search, onSearch, priority, onPriority }) {
  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search tasks"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />
      <select value={priority} onChange={(e) => onPriority(e.target.value)}>
        <option value="">All priorities</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>
    </div>
  );
}