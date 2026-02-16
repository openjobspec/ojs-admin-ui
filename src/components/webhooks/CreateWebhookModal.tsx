import { useState } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { useKeyboard } from '@/hooks/useKeyboard';

const AVAILABLE_EVENTS = [
  'job.enqueued', 'job.started', 'job.completed', 'job.failed', 'job.retried', 'job.cancelled', 'job.discarded',
  'queue.paused', 'queue.resumed',
  'worker.registered', 'worker.deregistered', 'worker.stale',
  'workflow.started', 'workflow.completed', 'workflow.failed',
  'cron.triggered',
];

interface CreateWebhookModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreateWebhookModal({ onClose, onCreated }: CreateWebhookModalProps) {
  const client = useClient();
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [secret, setSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useKeyboard('Escape', onClose);

  const toggleEvent = (e: string) => {
    setEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  };

  const handleCreate = async () => {
    if (!url || events.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await client.createWebhook({ url, events, secret: secret || undefined });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Create Webhook Subscription</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Endpoint URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Secret (optional)</label>
            <input
              type="text"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="HMAC signing secret"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-2">Events</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-auto">
              {AVAILABLE_EVENTS.map((e) => (
                <label key={e} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={events.includes(e)}
                    onChange={() => toggleEvent(e)}
                    className="rounded border-gray-300"
                  />
                  <span>{e}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !url || events.length === 0}
            className="px-4 py-2 text-sm rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create Webhook'}
          </button>
        </div>
      </div>
    </div>
  );
}
