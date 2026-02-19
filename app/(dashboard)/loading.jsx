export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-[var(--color-background)] rounded animate-pulse" />
        <div className="h-10 w-24 bg-[var(--color-background)] rounded animate-pulse" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-[var(--color-card)] rounded-xl animate-pulse" />
        <div className="h-64 bg-[var(--color-card)] rounded-xl animate-pulse" />
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 bg-[var(--color-card)] rounded-xl animate-pulse" />
        <div className="h-80 bg-[var(--color-card)] rounded-xl animate-pulse" />
        <div className="h-80 bg-[var(--color-card)] rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
