import { useNavigate } from 'react-router-dom';
import type { ModelVersion } from '../types';

interface DeployToServingButtonProps {
  version: ModelVersion;
}

export function DeployToServingButton({ version }: DeployToServingButtonProps) {
  const navigate = useNavigate();

  const handleDeploy = () => {
    const params = new URLSearchParams({
      name: version.name,
      modelUri: version.source,
    });
    navigate(`/serving/deploy?${params.toString()}`);
  };

  return (
    <button
      onClick={handleDeploy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      Deploy to Serving
    </button>
  );
}
