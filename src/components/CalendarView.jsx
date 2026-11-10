import { useState } from 'react';
import { todayString } from '../utils/taskFilters';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Monday-first grid of the month, with leading blanks so each day lands on its weekday
function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) {
    const pad = (n) => String(n).padStart(2, '0');
    cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  }
  return cells;
}

export default function CalendarView({ tasks, onEdit }) {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const today = todayString();
  const cells = buildMonth(cursor.year, cursor.month);

  const byDate = {};
  for (const t of tasks) {
    (byDate[t.dueDate] ??= []).push(t);
  }

  const label = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  function shift(delta) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button className="outline" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <strong>{label}</strong>
        <button className="outline" onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>

      <div className="calendar-grid">
        {WEEKDAYS.map((w) => (
          <div className="calendar-weekday" key={w}>{w}</div>
        ))}

        {cells.map((date, i) =>
          date ? (
            <div className={`calendar-day ${date === today ? 'today' : ''}`} key={date}>
              <span className="calendar-date">{Number(date.slice(-2))}</span>
              {(byDate[date] ?? []).map((t) => (
                <button
                  key={t.id}
                  className={`calendar-task ${t.status === 'DONE' ? 'done' : ''}`}
                  onClick={() => onEdit(t)}
                  title={t.title}
                >
                  {t.title}
                </button>
              ))}
            </div>
          ) : (
            <div className="calendar-day empty-cell" key={`blank-${i}`} />
          ),
        )}
      </div>
    </div>
  );
}
