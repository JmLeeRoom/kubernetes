import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MetricSeries } from '../types';

interface TimeSeriesChartProps {
  series: MetricSeries[];
  height?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function TimeSeriesChart({ series, height = 300 }: TimeSeriesChartProps) {
  if (series.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border text-sm text-muted-foreground"
        style={{ height }}
      >
        No data to display
      </div>
    );
  }

  const timestamps = new Set<number>();
  series.forEach((s) => s.values.forEach(([ts]) => timestamps.add(ts)));
  const sortedTs = Array.from(timestamps).sort((a, b) => a - b);

  const chartData = sortedTs.map((ts) => {
    const point: Record<string, number | string> = {
      time: new Date(ts * 1000).toLocaleTimeString(),
    };
    series.forEach((s, idx) => {
      const match = s.values.find(([t]) => t === ts);
      const label = s.metric.__name__ || `series-${idx}`;
      point[label] = match ? parseFloat(match[1]) : 0;
    });
    return point;
  });

  const seriesKeys = series.map(
    (s, idx) => s.metric.__name__ || `series-${idx}`
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
        />
        <Legend />
        {seriesKeys.map((key, idx) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={COLORS[idx % COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
