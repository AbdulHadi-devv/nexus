export function ItemCardSkeleton() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-header" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text-short" />
      <div className="skeleton-tags">
        <div className="skeleton skeleton-tag" />
        <div className="skeleton skeleton-tag" />
      </div>
    </div>
  );
}

export function ItemGridSkeleton({ count = 6 }) {
  return (
    <div className="items-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton({ count = 6 }) {
  return (
    <div className="knowledge-stats">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton-stat" />
      ))}
    </div>
  );
}