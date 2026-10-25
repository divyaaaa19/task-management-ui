export default function Sidebar({ user, search, onSearch, onLogout }) {
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="logo">
        <span className="logo-mark">✔</span> TaskFlow
      </div>

      <input
        className="search"
        type="search"
        placeholder="Search tasks"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
      />

      <div className="menu-label">MAIN MENU</div>
      <nav>
        <div className="nav-item active">Tasks</div>
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">{initials}</div>
        <div className="user">
          <strong>{user.name}</strong>
          <small>{user.email}</small>
        </div>
        <button className="link" onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
}