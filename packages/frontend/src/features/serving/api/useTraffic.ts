import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CanaryStatus, InferenceService } from '../types';

export function useCanaryStatus(name: string | undefined) {
  return useQuery<CanaryStatus>({
    queryKey: ['canary', name],
    queryFn: async () => {
      const { data } = await api.get<InferenceService>(`/serving/inference-services/${name}`);
      return {
        name: data.name,
        canary_percent: data.traffic.canary,
        default_percent: data.traffic.default,
        canary_ready: data.ready,
      };
    },
    enabled: !!name,
    refetchInterval: 10_000,
  });
}

export function useUpdateTraffic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, canaryPercent }: { name: string; canaryPercent: number }) => {
      const { data } = await api.patch(`/serving/inference-services/${name}/traffic`, {
        canary_percent: canaryPercent,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['inference-services', variables.name] });
      qc.invalidateQueries({ queryKey: ['canary', variables.name] });
    },
  });
}
