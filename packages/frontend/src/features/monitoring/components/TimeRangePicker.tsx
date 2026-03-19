import { cn } from '@/lib/utils';
import type { TimeRange } from '../types';

interface TimeRangePickerProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const OPTIONS: { label: string; value: TimeRange }[] = [
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '6h', value: '6h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
];

export function TimeRangePicker({ value, onChange }: TimeRangePickerProps) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/50 p-0.5">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-md px-3 py-1 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const RANGE_MS: Record<TimeRange, number> = {
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

export function rangeToEpoch(range: TimeRange): { start: string; end: string } {
  const now = Date.now();
  return {
    start: String(Math.floor((now - RANGE_MS[range]) / 1000)),
    end: String(Math.floor(now / 1000)),
  };
}
