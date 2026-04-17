export function LoyaltyCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="h-56 rounded-xl bg-surface-container-low" />
      <div className="h-14 rounded-lg bg-surface-container-low" />
      <div className="grid grid-cols-2 gap-4">
        <div className="aspect-square rounded-lg bg-surface-container-low" />
        <div className="aspect-square rounded-lg bg-surface-container-low" />
        <div className="col-span-2 h-24 rounded-lg bg-surface-container-low" />
      </div>
      <div className="h-6 w-40 rounded bg-surface-container-low" />
      <div className="space-y-4">
        <div className="h-16 rounded-lg bg-surface-container-low" />
        <div className="h-16 rounded-lg bg-surface-container-low" />
      </div>
    </div>
  );
}
