import { useAlerts, useSilenceAlert } from '../api';
import { AlertList } from '../components/AlertList';

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const silenceMutation = useSilenceAlert();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''} &middot; auto-refreshes
            every 30s
          </p>
        </div>
      </div>

      <AlertList
        alerts={alerts}
        isLoading={isLoading}
        onSilence={(name) => silenceMutation.mutate(name)}
      />
    </div>
  );
}
