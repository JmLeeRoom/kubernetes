import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Flow, FlowRun } from '../types';

export function useFlows() {
  return useQuery<Flow[]>({
    queryKey: ['flows'],
    queryFn: async () => {
      const { data } = await api.get('/flows');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useFlowRuns(flowId?: string) {
  return useQuery<FlowRun[]>({
    queryKey: ['flow-runs', flowId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (flowId) params.flow_id = flowId;
      const { data } = await api.get('/flows/runs', { params });
      return data;
    },
    refetchInterval: 15_000,
  });
}

export function useCancelFlowRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (runId: string) => {
      const { data } = await api.post(`/flows/runs/${runId}/cancel`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['flow-runs'] });
    },
  });
}
