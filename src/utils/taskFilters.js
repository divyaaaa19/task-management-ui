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

// Deadline in local time: the due time if one is set, otherwise the end of the due day
export function deadlineOf(dueDate, dueTime) {
  const [y, m, d] = dueDate.split('-').map(Number);
  if (dueTime) {
    const [hh, mm] = dueTime.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
  }
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

// "3d 13h", "13h 59m" or "42m"
function formatSpan(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Time left before the task is due, or how late it is. Null for done tasks.
// tone: 'late' (overdue), 'soon' (under 24 hours) or '' (plenty of time)
export function timeLeft(task, now = new Date()) {
  if (!task || task.status === 'DONE' || !task.dueDate) return null;
  const diff = deadlineOf(task.dueDate, task.dueTime) - now.getTime();
  if (diff < 0) {
    return { overdue: true, tone: 'late', label: `${formatSpan(-diff)} late` };
  }
  if (diff < 60000) return { overdue: false, tone: 'soon', label: 'Due now' };
  const tone = diff < 24 * 3600000 ? 'soon' : '';
  return { overdue: false, tone, label: `${formatSpan(diff)} left` };
}

// Overdue tasks first; the chosen order is kept within each group
export function overdueFirst(tasks, now = new Date()) {
  const late = [];
  const rest = [];
  for (const t of tasks) {
    (timeLeft(t, now)?.overdue ? late : rest).push(t);
  }
  return [...late, ...rest];
}
