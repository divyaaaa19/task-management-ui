const PRIORITY_RANK = { HIGH: 0, MEDIUM: 1, LOW: 2 };

// Local date as yyyy-mm-dd, the same format as dueDate
export function todayString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Due filter: 'all', 'today' (due today, not done) or 'overdue' (due before today, not done)
export function filterTasks(tasks, due = 'all', today = todayString()) {
  if (due === 'all') return tasks;
  return tasks.filter((t) => {
    if (t.status === 'DONE') return false;
    if (due === 'today') return t.dueDate === today;
    if (due === 'overdue') return t.dueDate < today;
    return true;
  });
}

// Sort options: 'due' (soonest first), 'priority' (high first, then due date), 'newest' (created last)
export function sortTasks(tasks, sort = 'due') {
  const list = [...tasks];
  if (sort === 'priority') {
    return list.sort(
      (a, b) =>
        PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
        a.dueDate.localeCompare(b.dueDate),
    );
  }
  if (sort === 'newest') {
    return list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }
  return list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
