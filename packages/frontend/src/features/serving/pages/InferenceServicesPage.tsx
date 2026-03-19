import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInferenceServices, useDeleteInferenceService } from '../api';
import { ISvcCard } from '../components/ISvcCard';
import { MetricsPreview } from '../components/MetricsPreview';

export default function InferenceServicesPage() {
  const { data: services = [], isLoading } = useInferenceServices();
  const deleteMutation = useDeleteInferenceService();
  const navigate = useNavigate();
  const [selectedName, setSelectedName] = useState<string>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inference Services</h1>
          <p className="text-sm text-muted-foreground">
            {services.length} deployed models
          </p>
        </div>
        <button
          onClick={() => navigate('/serving/deploy')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Deploy New Model
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">No inference services deployed yet.</p>
          <button
            onClick={() => navigate('/serving/deploy')}
            className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Deploy Your First Model
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <ISvcCard
              key={svc.name}
              service={svc}
              isSelected={selectedName === svc.name}
              onSelect={setSelectedName}
              onDelete={(name) => deleteMutation.mutate(name)}
            />
          ))}
        </div>
      )}

      {selectedName && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">
            Metrics: {selectedName}
          </h2>
          <MetricsPreview name={selectedName} />
        </div>
      )}
    </div>
  );
}
