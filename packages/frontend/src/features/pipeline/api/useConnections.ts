import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Connection, SyncJob } from '../types';

export function useConnections() {
  return useQuery<Connection[]>({
    queryKey: ['connections'],
    queryFn: async () => {
      const { data } = await api.get('/pipeline/connections');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useConnectionJobs(connectionId: string | undefined) {
  return useQuery<SyncJob[]>({
    queryKey: ['connections', connectionId, 'jobs'],
    queryFn: async () => {
      const { data } = await api.get(`/pipeline/connections/${connectionId}/jobs`);
      return data;
    },
    enabled: !!connectionId,
  });
}

export function useTriggerSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data } = await api.post(`/pipeline/connections/${connectionId}/sync`);
      return data;
    },
    onSuccess: (_data, connectionId) => {
      qc.invalidateQueries({ queryKey: ['connections', connectionId, 'jobs'] });
    },
  });
}
