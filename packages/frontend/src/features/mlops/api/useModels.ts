import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { RegisteredModel, ModelVersion } from '../types';

export function useRegisteredModels() {
  return useQuery<RegisteredModel[]>({
    queryKey: ['mlops', 'models'],
    queryFn: async () => {
      const { data } = await api.get('/mlops/experiments/models');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useModelVersions(name: string | undefined) {
  return useQuery<ModelVersion[]>({
    queryKey: ['mlops', 'models', name, 'versions'],
    queryFn: async () => {
      const { data } = await api.get(`/mlops/experiments/models/${name}/versions`);
      return data;
    },
    enabled: !!name,
  });
}

export function useTransitionStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      version,
      stage,
    }: {
      name: string;
      version: string;
      stage: string;
    }) => {
      const { data } = await api.post(
        `/mlops/experiments/models/${name}/versions/${version}/stage`,
        { stage }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mlops', 'models'] });
    },
  });
}
