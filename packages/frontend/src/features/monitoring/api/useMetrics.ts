import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MetricsRangeResult } from '../types';

interface MetricsRangeParams {
  query: string;
  start: string;
  end: string;
  step?: string;
  enabled?: boolean;
}

export function useMetricsRange({ query, start, end, step = '15s', enabled = true }: MetricsRangeParams) {
  return useQuery<MetricsRangeResult>({
    queryKey: ['metrics', 'range', query, start, end, step],
    queryFn: async () => {
      const { data } = await api.get('/metrics/query_range', {
        params: { query, start, end, step },
      });
      return data;
    },
    staleTime: 10_000,
    enabled: enabled && !!query,
  });
}
