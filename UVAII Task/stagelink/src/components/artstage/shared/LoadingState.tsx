export function LoadingState({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="as-skeleton h-12 w-12 shrink-0 rounded-[8px]" />
          <div className="flex-1 space-y-2">
            <div className="as-skeleton h-4 w-2/3 rounded" />
            <div className="as-skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ className = '' }: { className?: string }) {
  return <div className={`as-skeleton rounded ${className}`} aria-hidden="true" />;
}
