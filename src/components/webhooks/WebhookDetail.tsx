import { useEffect, useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { WebhookSubscription } from '@/api/types';
import { JsonViewer } from '@/components/common/JsonViewer';

interface WebhookDetailProps {
  webhookId: string;
  onClose: () => void;
}

export function WebhookDetail({ webhookId, onClose }: WebhookDetailProps) {
  const client = useClient();
  const [wh, setWh] = useState<WebhookSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useKeyboard('Escape', onClose);

  const load = useCallback(async () => {
    try { setWh(await client.webhook(webhookId)); }
    catch (e) { setError(String(e)); }
  }, [client, webhookId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!wh) return <div className="p-4 text-gray-500">Loading…</div>;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Webhook</h2>
            <p className="text-xs text-gray-500 font-mono">{wh.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            {wh.active ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">Active</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">Inactive</span>
            )}
            {wh.failure_count != null && wh.failure_count > 0 && (
              <span className="text-xs text-red-600">{wh.failure_count} failures</span>
            )}
          </div>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Endpoint</h3>
            <div className="space-y-1 text-xs">
              <Row label="URL" value={wh.url} />
              <Row label="Created" value={new Date(wh.created_at).toLocaleString()} />
              {wh.updated_at && <Row label="Updated" value={new Date(wh.updated_at).toLocaleString()} />}
              {wh.last_delivery_at && <Row label="Last Delivery" value={new Date(wh.last_delivery_at).toLocaleString()} />}
              {wh.last_delivery_status != null && <Row label="Last Status" value={`HTTP ${wh.last_delivery_status}`} />}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Subscribed Events</h3>
            <div className="flex flex-wrap gap-1">
              {wh.events.map((e) => (
                <span key={e} className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded">{e}</span>
              ))}
            </div>
          </section>

          {wh.metadata && Object.keys(wh.metadata).length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Metadata</h3>
              <JsonViewer data={wh.metadata} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-gray-600 dark:text-gray-400">
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
