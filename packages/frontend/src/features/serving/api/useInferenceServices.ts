import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { InferenceService, InferenceServiceSpec, ServiceMetrics } from '../types';

export function useInferenceServices() {
  return useQuery<InferenceService[]>({
    queryKey: ['inference-services'],
    queryFn: async () => {
      const { data } = await api.get('/serving/inference-services');
      return data;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

export function useInferenceService(name: string | undefined) {
  return useQuery<InferenceService>({
    queryKey: ['inference-services', name],
    queryFn: async () => {
      const { data } = await api.get(`/serving/inference-services/${name}`);
      return data;
    },
    enabled: !!name,
  });
}

export function useServiceMetrics(name: string | undefined) {
  return useQuery<ServiceMetrics>({
    queryKey: ['inference-services', name, 'metrics'],
    queryFn: async () => {
      const { data } = await api.get(`/serving/inference-services/${name}/metrics`);
      return data;
    },
    enabled: !!name,
    refetchInterval: 15_000,
  });
}

export function useCreateInferenceService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (spec: InferenceServiceSpec) => {
      const { data } = await api.post('/serving/inference-services', spec);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inference-services'] });
    },
  });
}

export function useDeleteInferenceService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      await api.delete(`/serving/inference-services/${name}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inference-services'] });
    },
  });
}
