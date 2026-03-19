import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Alert } from '../types';

export function useAlerts() {
  return useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get('/alerts');
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useSilenceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { data } = await api.post(`/alerts/${alertId}/silence`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
}
