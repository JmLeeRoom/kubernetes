import { cn } from '@/lib/utils';
import type { Alert } from '../types';

interface AlertListProps {
  alerts: Alert[];
  isLoading?: boolean;
  onSilence?: (alertname: string) => void;
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export function AlertList({ alerts, isLoading, onSilence }: AlertListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-6 text-center">
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          No active alerts
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left font-medium">Alert</th>
            <th className="px-4 py-2 text-left font-medium">Severity</th>
            <th className="px-4 py-2 text-left font-medium">State</th>
            <th className="px-4 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert, idx) => (
            <tr key={`${alert.alertname}-${idx}`} className="border-b last:border-0">
              <td className="px-4 py-3 font-medium">{alert.alertname}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                    SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.info
                  )}
                >
                  {alert.severity}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{alert.state}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onSilence?.(alert.alertname)}
                  className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Silence
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
