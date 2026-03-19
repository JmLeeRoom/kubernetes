import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { LogQueryResult } from '../types';

interface LogsParams {
  query: string;
  start?: string;
  end?: string;
  limit?: number;
  enabled?: boolean;
}

export function useLogs({ query, start, end, limit = 100, enabled = true }: LogsParams) {
  return useQuery<LogQueryResult>({
    queryKey: ['logs', query, start, end, limit],
    queryFn: async () => {
      const { data } = await api.get('/logs/query', {
        params: { query, start, end, limit },
      });
      return data;
    },
    staleTime: 5_000,
    enabled: enabled && !!query,
  });
}
