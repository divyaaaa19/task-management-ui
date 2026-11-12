import { useEffect, useState } from 'react';
import { timeLeft } from '../utils/taskFilters';

// Shows the countdown for a task, refreshed every minute while the page is open
export default function TimeLeft({ task }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const info = timeLeft(task, now);
  if (!info) return null;
  return <span className={`pill timer ${info.tone}`}>{info.label}</span>;
}
