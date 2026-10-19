const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
];

export default function FilterBar({ filter, onChange, search, onSearchChange }) {
  return (
    <>
      <div className="filter-buttons">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`btn btn-filter ${filter === f.value ? 'active' : ''}`}
            onClick={() => onChange(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <input
        type="search"
        className="search-input"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </>
  );
}