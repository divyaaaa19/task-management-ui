export default function ProgressBar({ done, total }) {
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className="progress"
      role="progressbar"
      aria-label="Tasks completed"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="progress-head">
        <span>Completion</span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
