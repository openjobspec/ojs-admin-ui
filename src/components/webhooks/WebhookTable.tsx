import { useState } from 'react';
import type { WebhookSubscription } from '@/api/types';
import { useClient } from '@/hooks/useAppContext';
import { timeAgo } from '@/lib/formatting';
import { ConfirmModal } from '@/components/common/ConfirmModal';

interface WebhookTableProps {
  webhooks: WebhookSubscription[];
  onRefresh: () => void;
  onSelect: (id: string) => void;
}

export function WebhookTable({ webhooks, onRefresh, onSelect }: WebhookTableProps) {
  const client = useClient();
  const [acting, setActing] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WebhookSubscription | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; status: number; ms: number } | null>(null);

  const toggleActive = async (wh: WebhookSubscription) => {
    setActing(wh.id);
    try {
      await client.updateWebhook(wh.id, { active: !wh.active });
      onRefresh();
    } finally {
      setActing(null);
    }
  };

  const testDelivery = async (wh: WebhookSubscription) => {
    setActing(wh.id);
    try {
      const res = await client.testWebhook(wh.id);
      setTestResult({ id: wh.id, status: res.status, ms: res.response_time_ms });
      setTimeout(() => setTestResult(null), 5000);
    } catch {
      setTestResult({ id: wh.id, status: 0, ms: 0 });
      setTimeout(() => setTestResult(null), 5000);
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await client.deleteWebhook(deleteTarget.id);
    setDeleteTarget(null);
    onRefresh();
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">URL</th>
              <th className="text-left px-3 py-3">Events</th>
              <th className="text-center px-3 py-3">Status</th>
              <th className="text-right px-3 py-3">Last Delivery</th>
              <th className="text-right px-3 py-3">Failures</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {webhooks.map((wh) => (
              <tr key={wh.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs truncate max-w-xs cursor-pointer" onClick={() => onSelect(wh.id)}>{wh.url}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-1">
                    {wh.events.slice(0, 3).map((e) => (
                      <span key={e} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">{e}</span>
                    ))}
                    {wh.events.length > 3 && (
                      <span className="text-xs text-gray-400">+{wh.events.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-center">
                  {wh.active ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">Active</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">Inactive</span>
                  )}
                  {testResult?.id === wh.id && (
                    <span className={`ml-1 text-xs ${testResult.status >= 200 && testResult.status < 300 ? 'text-green-600' : 'text-red-600'}`}>
                      {testResult.status > 0 ? `${testResult.status} (${testResult.ms}ms)` : 'Failed'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right text-gray-500 text-xs">
                  {wh.last_delivery_at ? (
                    <div>
                      <div>{timeAgo(wh.last_delivery_at)}</div>
                      {wh.last_delivery_status && (
                        <div className={wh.last_delivery_status < 300 ? 'text-green-600' : 'text-red-600'}>
                          HTTP {wh.last_delivery_status}
                        </div>
                      )}
                    </div>
                  ) : '—'}
                </td>
                <td className="px-3 py-3 text-right">
                  {wh.failure_count != null && wh.failure_count > 0 ? (
                    <span className="text-red-600 font-medium">{wh.failure_count}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => toggleActive(wh)}
                      disabled={acting === wh.id}
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                    >
                      {acting === wh.id ? '…' : wh.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => testDelivery(wh)}
                      disabled={acting === wh.id}
                      className="text-xs px-2 py-1 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 disabled:opacity-40"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => setDeleteTarget(wh)}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {webhooks.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">No webhook subscriptions.</p>
        )}
      </div>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Webhook"
        message={`This will permanently remove the webhook subscription to "${deleteTarget?.url}".`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
