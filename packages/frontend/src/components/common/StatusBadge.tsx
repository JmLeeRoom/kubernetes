import { cn } from '@/lib/utils';

type Status = 'healthy' | 'warning' | 'error' | 'unknown';

const statusStyles: Record<Status, string> = {
  healthy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

interface StatusBadgeProps {
  status: Status;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      <span
        className={cn('h-1.5 w-1.5 rounded-full', {
          'bg-green-500': status === 'healthy',
          'bg-yellow-500': status === 'warning',
          'bg-red-500': status === 'error',
          'bg-gray-500': status === 'unknown',
        })}
      />
      {label}
    </span>
  );
}
