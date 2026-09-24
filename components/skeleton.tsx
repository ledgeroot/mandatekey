/** A placeholder in the shape of the content it replaces, never a spinner. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton block ${className}`} aria-hidden />;
}

/** Three rows at roughly the height of a receipt row. */
export function RowSkeletons({ rows = 3 }: { rows?: number }) {
  return (
    <div className="divide-line divide-y">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="space-y-2 py-3">
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-2.5 w-2/5" />
        </div>
      ))}
    </div>
  );
}
