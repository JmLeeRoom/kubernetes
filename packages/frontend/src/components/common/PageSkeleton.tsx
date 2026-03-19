export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" data-testid="skeleton" />
      <div className="h-64 w-full animate-pulse rounded-lg bg-muted" data-testid="skeleton" />
      <div className="grid grid-cols-3 gap-4">
        <div className="h-32 animate-pulse rounded-lg bg-muted" data-testid="skeleton" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" data-testid="skeleton" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" data-testid="skeleton" />
      </div>
    </div>
  );
}
