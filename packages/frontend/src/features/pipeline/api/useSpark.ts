import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SparkJob } from '../types';

export function useSparkJobs(appId?: string) {
  return useQuery<SparkJob[]>({
    queryKey: ['spark', 'jobs', appId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (appId) params.app_id = appId;
      const { data } = await api.get('/pipeline/spark/jobs', { params });
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
