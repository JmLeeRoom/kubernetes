import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { DAG, DAGGraph, DAGRun } from '../types';

export function useDAGs() {
  return useQuery<DAG[]>({
    queryKey: ['mlops', 'dags'],
    queryFn: async () => {
      const { data } = await api.get('/mlops/dags');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useDAGGraph(dagId: string | undefined) {
  return useQuery<DAGGraph>({
    queryKey: ['mlops', 'dags', dagId, 'graph'],
    queryFn: async () => {
      const { data } = await api.get(`/mlops/dags/${dagId}/graph`);
      return data;
    },
    enabled: !!dagId,
  });
}

export function useDAGRuns(dagId: string | undefined) {
  return useQuery<DAGRun[]>({
    queryKey: ['mlops', 'dags', dagId, 'runs'],
    queryFn: async () => {
      const { data } = await api.get(`/mlops/dags/${dagId}/runs`);
      return data;
    },
    enabled: !!dagId,
  });
}

export function useTriggerDAG() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dagId,
      conf,
    }: {
      dagId: string;
      conf: Record<string, unknown>;
    }) => {
      const { data } = await api.post(`/mlops/dags/${dagId}/trigger`, { conf });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mlops', 'dags'] });
    },
  });
}

export function useTogglePause() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dagId,
      isPaused,
    }: {
      dagId: string;
      isPaused: boolean;
    }) => {
      const { data } = await api.patch(`/mlops/dags/${dagId}/pause`, {
        is_paused: isPaused,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mlops', 'dags'] });
    },
  });
}
