export function RewardsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Balance hero skeleton */}
      <div className="h-28 animate-pulse rounded-xl bg-surface-container-low" />
      {/* Catalog header skeleton */}
      <div className="h-7 w-40 animate-pulse rounded bg-surface-container-low" />
      {/* Reward card skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-lg bg-surface-container-low p-5"
        >
          <div className="flex gap-4">
            <div className="h-20 w-20 animate-pulse rounded-lg bg-surface-container-high" />
            <div className="flex flex-1 flex-col gap-2 pt-1">
              <div className="h-5 w-3/4 animate-pulse rounded bg-surface-container-high" />
              <div className="h-4 w-full animate-pulse rounded bg-surface-container-high" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-surface-container-high" />
            </div>
          </div>
          <div className="h-11 animate-pulse rounded-md bg-surface-container-high" />
        </div>
      ))}
    </div>
  );
}
