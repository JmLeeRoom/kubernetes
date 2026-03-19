import { useNavigate } from 'react-router-dom';
import { DeployModelForm } from '../components/DeployModelForm';

export default function DeployModelPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deploy Model</h1>
        <p className="text-sm text-muted-foreground">
          Deploy a new InferenceService to KServe
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <DeployModelForm onSuccess={() => navigate('/serving/models')} />
      </div>
    </div>
  );
}
