import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateInferenceService } from '../api';

const deploySchema = z.object({
  name: z
    .string()
    .min(1, 'Required')
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Lowercase letters, numbers, hyphens only'),
  framework: z.enum(['sklearn', 'pytorch', 'tensorflow', 'onnx', 'xgboost']),
  model_uri: z
    .string()
    .min(1, 'Required')
    .refine(
      (v) => v.startsWith('s3://') || v.startsWith('gs://') || v.startsWith('pvc://'),
      'Must start with s3://, gs://, or pvc://'
    ),
  min_replicas: z.coerce.number().int().min(0).max(10),
  max_replicas: z.coerce.number().int().min(1).max(100),
  canary_percent: z.coerce.number().int().min(0).max(100).optional(),
});

type DeployFormValues = z.infer<typeof deploySchema>;

interface DeployModelFormProps {
  onSuccess?: () => void;
}

export function DeployModelForm({ onSuccess }: DeployModelFormProps) {
  const mutation = useCreateInferenceService();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeployFormValues>({
    resolver: zodResolver(deploySchema),
    defaultValues: {
      min_replicas: 1,
      max_replicas: 3,
      framework: 'sklearn',
    },
  });

  const onSubmit = (data: DeployFormValues) => {
    mutation.mutate(data, { onSuccess });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Service Name
          </label>
          <input
            id="name"
            {...register('name')}
            placeholder="my-model"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="framework" className="text-sm font-medium">
            Framework
          </label>
          <select
            id="framework"
            {...register('framework')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {['sklearn', 'pytorch', 'tensorflow', 'onnx', 'xgboost'].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="model_uri" className="text-sm font-medium">
          Model URI
        </label>
        <input
          id="model_uri"
          {...register('model_uri')}
          placeholder="s3://my-bucket/models/v1"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
        {errors.model_uri && (
          <p className="text-xs text-red-500">{errors.model_uri.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor="min_replicas" className="text-sm font-medium">
            Min Replicas
          </label>
          <input
            id="min_replicas"
            type="number"
            {...register('min_replicas')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="max_replicas" className="text-sm font-medium">
            Max Replicas
          </label>
          <input
            id="max_replicas"
            type="number"
            {...register('max_replicas')}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="canary_percent" className="text-sm font-medium">
            Canary %
          </label>
          <input
            id="canary_percent"
            type="number"
            {...register('canary_percent')}
            placeholder="0"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {mutation.isPending ? 'Deploying...' : 'Deploy Model'}
      </button>

      {mutation.isError && (
        <p className="text-sm text-red-500">
          Deploy failed: {(mutation.error as Error).message}
        </p>
      )}
      {mutation.isSuccess && (
        <p className="text-sm text-green-600">Model deployed successfully!</p>
      )}
    </form>
  );
}
