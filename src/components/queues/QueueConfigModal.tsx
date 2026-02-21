import { useState, useEffect } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { QueueDetail, PriorityStats } from '@/api/types';
import { PriorityDistribution } from '@/components/queues/PriorityDistribution';

interface QueueConfigModalProps {
  queue: QueueDetail;
  onClose: () => void;
  onSave: () => void;
}

export function QueueConfigModal({ queue, onClose, onSave }: QueueConfigModalProps) {
  const client = useClient();
  const [concurrency, setConcurrency] = useState(String(queue.configuration?.concurrency ?? ''));
  const [rateLimit, setRateLimit] = useState(String(queue.configuration?.rate_limit?.limit ?? ''));
  const [ratePeriod, setRatePeriod] = useState(queue.configuration?.rate_limit?.period ?? '1m');
  const [retCompleted, setRetCompleted] = useState(queue.configuration?.retention?.completed ?? '');
  const [retDiscarded, setRetDiscarded] = useState(queue.configuration?.retention?.discarded ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priorityStats, setPriorityStats] = useState<PriorityStats | null>(null);

  useKeyboard('Escape', onClose);

  useEffect(() => {
    client.priorityStats(queue.name).then(setPriorityStats).catch(() => setPriorityStats(null));
  }, [client, queue.name]);

  // Fetch full queue detail on mount if configuration is missing
  useEffect(() => {
    if (!queue.configuration) {
      client.queue(queue.name).then((q) => {
        if (q.configuration) {
          setConcurrency(String(q.configuration.concurrency ?? ''));
          setRateLimit(String(q.configuration.rate_limit?.limit ?? ''));
          setRatePeriod(q.configuration.rate_limit?.period ?? '1m');
          setRetCompleted(q.configuration.retention?.completed ?? '');
          setRetDiscarded(q.configuration.retention?.discarded ?? '');
        }
      }).catch(() => {});
    }
  }, [client, queue]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const config: Record<string, unknown> = {};
      if (concurrency) config.concurrency = Number(concurrency);
      if (rateLimit) config.rate_limit = { limit: Number(rateLimit), period: ratePeriod };
      if (retCompleted || retDiscarded) {
        config.retention = {
          ...(retCompleted ? { completed: retCompleted } : {}),
          ...(retDiscarded ? { discarded: retDiscarded } : {}),
        };
      }
      await client.updateQueueConfig(queue.name, config);
      onSave();
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
        <h3 className="text-lg font-semibold mb-4">Configure Queue: {queue.name}</h3>

        {/* Current Configuration Summary */}
        {queue.configuration && (
          <div className="mb-4 bg-gray-50 dark:bg-gray-800 rounded p-3 text-xs space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Current Configuration</div>
            <div className="flex justify-between">
              <span className="text-gray-500">Concurrency</span>
              <span>{queue.configuration.concurrency ?? 'Default'}</span>
            </div>
            {queue.configuration.rate_limit && (
              <div className="flex justify-between">
                <span className="text-gray-500">Rate Limit</span>
                <span>{queue.configuration.rate_limit.limit} / {queue.configuration.rate_limit.period}</span>
              </div>
            )}
            {queue.configuration.retention && (
              <>
                {queue.configuration.retention.completed && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed Retention</span>
                    <span>{queue.configuration.retention.completed}</span>
                  </div>
                )}
                {queue.configuration.retention.discarded && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discarded Retention</span>
                    <span>{queue.configuration.retention.discarded}</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Concurrency</label>
            <input
              type="number"
              value={concurrency}
              onChange={(e) => setConcurrency(e.target.value)}
              placeholder="Default"
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
              min="1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Rate Limit</label>
              <input
                type="number"
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                placeholder="No limit"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
                min="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Rate Period</label>
              <select
                value={ratePeriod}
                onChange={(e) => setRatePeriod(e.target.value)}
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
              >
                <option value="1s">1 second</option>
                <option value="10s">10 seconds</option>
                <option value="1m">1 minute</option>
                <option value="5m">5 minutes</option>
                <option value="1h">1 hour</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Completed Retention</label>
              <input
                type="text"
                value={retCompleted}
                onChange={(e) => setRetCompleted(e.target.value)}
                placeholder="e.g. 24h, 7d"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Discarded Retention</label>
              <input
                type="text"
                value={retDiscarded}
                onChange={(e) => setRetDiscarded(e.target.value)}
                placeholder="e.g. 30d"
                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        {priorityStats && (
          <div className="mt-4">
            <PriorityDistribution stats={priorityStats} />
          </div>
        )}

        {/* Backpressure */}
        {queue.configuration?.backpressure && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Backpressure</h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${
                  queue.configuration.backpressure.state === 'critical' ? 'text-red-600' :
                  queue.configuration.backpressure.state === 'warning' ? 'text-amber-600' :
                  'text-green-600'
                }`}>
                  {queue.configuration.backpressure.state ?? (queue.configuration.backpressure.enabled ? 'enabled' : 'disabled')}
                </span>
              </div>
              {queue.configuration.backpressure.strategy && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Strategy</span>
                  <span>{queue.configuration.backpressure.strategy}</span>
                </div>
              )}
              {queue.configuration.backpressure.threshold != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Threshold</span>
                  <span>{queue.configuration.backpressure.threshold}</span>
                </div>
              )}
              {queue.configuration.backpressure.current_depth != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Depth</span>
                  <span className={
                    queue.configuration.backpressure.threshold != null && queue.configuration.backpressure.current_depth > queue.configuration.backpressure.threshold
                      ? 'text-red-600 font-medium' : ''
                  }>
                    {queue.configuration.backpressure.current_depth}
                    {queue.configuration.backpressure.threshold != null && ` / ${queue.configuration.backpressure.threshold}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}

