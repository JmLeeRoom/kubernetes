import { useState } from 'react';

interface TriggerDAGDialogProps {
  dagId: string;
  open: boolean;
  onClose: () => void;
  onTrigger: (dagId: string, conf: Record<string, unknown>) => void;
}

export function TriggerDAGDialog({ dagId, open, onClose, onTrigger }: TriggerDAGDialogProps) {
  const [confText, setConfText] = useState('{}');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(confText);
      setError('');
      onTrigger(dagId, parsed);
      onClose();
    } catch {
      setError('Invalid JSON');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h3 className="text-lg font-semibold mb-1">Trigger DAG</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manually trigger <span className="font-mono">{dagId}</span>
        </p>

        <label className="block text-sm font-medium mb-1">Configuration (JSON)</label>
        <textarea
          value={confText}
          onChange={(e) => setConfText(e.target.value)}
          rows={5}
          className="w-full border rounded-md p-2 text-sm font-mono bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Trigger
          </button>
        </div>
      </div>
    </div>
  );
}
