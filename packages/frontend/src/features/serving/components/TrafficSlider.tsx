import { useState } from 'react';
import { useUpdateTraffic } from '../api';

interface TrafficSliderProps {
  name: string;
  currentCanary: number;
}

export function TrafficSlider({ name, currentCanary }: TrafficSliderProps) {
  const [value, setValue] = useState(currentCanary);
  const mutation = useUpdateTraffic();

  const handleApply = () => {
    mutation.mutate({ name, canaryPercent: value });
  };

  const defaultPct = 100 - value;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span>Default: {defaultPct}%</span>
        <span className="text-blue-500">Canary: {value}%</span>
      </div>

      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        <div
          className="bg-primary transition-all"
          style={{ width: `${defaultPct}%` }}
        />
        <div
          className="bg-blue-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full"
      />

      <div className="flex gap-2">
        <button
          onClick={handleApply}
          disabled={mutation.isPending || value === currentCanary}
          className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Updating...' : 'Apply Traffic Split'}
        </button>
        {value > 0 && (
          <button
            onClick={() => {
              setValue(0);
              mutation.mutate({ name, canaryPercent: 0 });
            }}
            className="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Promote (100% Default)
          </button>
        )}
      </div>

      {mutation.isError && (
        <p className="text-xs text-red-500">Failed to update traffic</p>
      )}
    </div>
  );
}
