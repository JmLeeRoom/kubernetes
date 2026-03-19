import { useState } from 'react';
import { useRegisteredModels, useModelVersions, useTransitionStage } from '../api';
import { ModelCard } from '../components/ModelCard';
import { VersionTable } from '../components/VersionTable';
import { DeployToServingButton } from '../components/DeployToServingButton';

export default function ModelRegistryPage() {
  const [selectedModel, setSelectedModel] = useState<string>();
  const { data: models, isLoading } = useRegisteredModels();
  const { data: versions } = useModelVersions(selectedModel);
  const transitionMutation = useTransitionStage();

  const handleTransition = (name: string, version: string, stage: string) => {
    transitionMutation.mutate({ name, version, stage });
  };

  const productionVersion = versions?.find((v) => v.current_stage === 'Production');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Model Registry</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(models ?? []).map((model) => (
            <ModelCard
              key={model.name}
              model={model}
              isSelected={selectedModel === model.name}
              onSelect={setSelectedModel}
            />
          ))}
          {models?.length === 0 && (
            <p className="text-muted-foreground col-span-full py-8 text-center">
              No registered models found.
            </p>
          )}
        </div>
      )}

      {selectedModel && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{selectedModel} — Versions</h2>
            {productionVersion && <DeployToServingButton version={productionVersion} />}
          </div>
          <div className="border rounded-lg p-4">
            <VersionTable
              versions={versions ?? []}
              onTransition={handleTransition}
            />
          </div>
        </div>
      )}
    </div>
  );
}
