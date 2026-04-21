export function TransactionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-surface-container-lowest p-6 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-full animate-pulse bg-surface-container-high shrink-0" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-surface-container-high" />
              <div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-5 w-12 animate-pulse rounded bg-surface-container-high" />
            <div className="h-3 w-10 animate-pulse rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  );
}
