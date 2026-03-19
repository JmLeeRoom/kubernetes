import { cn } from '@/lib/utils';

interface ResourceUsageGaugeProps {
  label: string;
  used: number;
  total: number;
  unit?: string;
}

export function ResourceUsageGauge({ label, used, total, unit = '' }: ResourceUsageGaugeProps) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const color =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {used}
          {unit} / {total}
          {unit}
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-muted-foreground">{pct}%</p>
    </div>
  );
}
