import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TraceDetail, TraceSearchResult } from '../types';

interface TraceSearchParams {
  serviceName?: string;
  operation?: string;
  minDuration?: string;
  maxDuration?: string;
  limit?: number;
  enabled?: boolean;
}

export function useTraceSearch({
  serviceName,
  operation,
  minDuration,
  maxDuration,
  limit = 20,
  enabled = true,
}: TraceSearchParams) {
  return useQuery<TraceSearchResult>({
    queryKey: ['traces', 'search', serviceName, operation, minDuration, maxDuration, limit],
    queryFn: async () => {
      const { data } = await api.get('/traces/search', {
        params: {
          service_name: serviceName,
          operation,
          min_duration: minDuration,
          max_duration: maxDuration,
          limit,
        },
      });
      return data;
    },
    staleTime: 10_000,
    enabled,
  });
}

export function useTrace(traceId: string | undefined) {
  return useQuery<TraceDetail>({
    queryKey: ['traces', traceId],
    queryFn: async () => {
      const { data } = await api.get(`/traces/${traceId}`);
      return data;
    },
    enabled: !!traceId,
  });
}
