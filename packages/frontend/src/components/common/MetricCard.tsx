import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  className?: string;
}

export function MetricCard({ title, value, unit, trend, className }: MetricCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-4 shadow-sm', className)}>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-card-foreground">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        {trend && (
          <span
            className={cn('ml-2 text-xs font-medium', {
              'text-green-600': trend === 'up',
              'text-red-600': trend === 'down',
              'text-gray-500': trend === 'flat',
            })}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}
