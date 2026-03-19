interface MetricChartProps {
  label: string;
  values: number[];
}

export function MetricChart({ label, values }: MetricChartProps) {
  if (values.length === 0) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return (
    <div className="border rounded-lg p-4">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">{label}</h4>
      <div className="flex items-end gap-1 h-24">
        {values.map((v, i) => {
          const height = ((v - min) / range) * 100;
          return (
            <div
              key={i}
              className="flex-1 bg-primary/70 rounded-t hover:bg-primary transition-colors"
              style={{ height: `${Math.max(height, 4)}%` }}
              title={`${v.toFixed(4)}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{min.toFixed(3)}</span>
        <span>{max.toFixed(3)}</span>
      </div>
    </div>
  );
}
