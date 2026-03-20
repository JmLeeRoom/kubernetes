import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { K8sNode, K8sPod } from '../types';

export function useNodes() {
  return useQuery<K8sNode[]>({
    queryKey: ['k8s', 'nodes'],
    queryFn: async () => {
      const { data } = await api.get('/monitoring/k8s/nodes');
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function usePods(namespace?: string) {
  return useQuery<K8sPod[]>({
    queryKey: ['k8s', 'pods', namespace],
    queryFn: async () => {
      const { data } = await api.get('/monitoring/k8s/pods', { params: { namespace } });
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}
