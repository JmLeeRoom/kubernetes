import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Experiment, Run } from '../types';

export function useExperiments() {
  return useQuery<Experiment[]>({
    queryKey: ['mlops', 'experiments'],
    queryFn: async () => {
      const { data } = await api.get('/mlops/experiments');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useExperimentRuns(experimentId: string | undefined) {
  return useQuery<Run[]>({
    queryKey: ['mlops', 'experiments', experimentId, 'runs'],
    queryFn: async () => {
      const { data } = await api.get(`/mlops/experiments/${experimentId}/runs`);
      return data;
    },
    enabled: !!experimentId,
  });
}

export function useCompareRuns() {
  return useMutation<Run[], Error, string[]>({
    mutationFn: async (runIds: string[]) => {
      const { data } = await api.post('/mlops/experiments/runs/compare', {
        run_ids: runIds,
      });
      return data;
    },
  });
}
