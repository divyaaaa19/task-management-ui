// Grey placeholder columns shown while tasks load, so the layout doesn't jump
export default function TaskSkeleton() {
  return (
    <div className="board skeleton-board" aria-busy="true" aria-label="Loading tasks">
      {[0, 1, 2].map((col) => (
        <div className="column" key={col}>
          <div className="skeleton skeleton-head" />
          {[0, 1].map((card) => (
            <div className="skeleton-card" key={card}>
              <div className="skeleton skeleton-line short" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line tiny" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
