import { useEffect, useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { CronJob } from '@/api/types';
import { JsonViewer } from '@/components/common/JsonViewer';

interface CronDetailProps {
  cronId: string;
  onClose: () => void;
}

export function CronDetail({ cronId, onClose }: CronDetailProps) {
  const client = useClient();
  const [cron, setCron] = useState<CronJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useKeyboard('Escape', onClose);

  const load = useCallback(async () => {
    try { setCron(await client.cron(cronId)); }
    catch (e) { setError(String(e)); }
  }, [client, cronId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!cron) return <div className="p-4 text-gray-500">Loading…</div>;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{cron.name ?? cron.type}</h2>
            <p className="text-xs text-gray-500 font-mono">{cron.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            {cron.enabled ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">Active</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-full">Disabled</span>
            )}
          </div>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Schedule</h3>
            <div className="space-y-1 text-xs">
              <Row label="Cron Expression" value={cron.schedule} />
              <Row label="Timezone" value={cron.timezone ?? 'UTC'} />
              <Row label="Queue" value={cron.queue} />
              <Row label="Job Type" value={cron.type} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Timing</h3>
            <div className="space-y-1 text-xs">
              <Row label="Created" value={new Date(cron.created_at).toLocaleString()} />
              {cron.last_run_at && <Row label="Last Run" value={new Date(cron.last_run_at).toLocaleString()} />}
              {cron.next_run_at && <Row label="Next Run" value={new Date(cron.next_run_at).toLocaleString()} />}
              {cron.updated_at && <Row label="Updated" value={new Date(cron.updated_at).toLocaleString()} />}
            </div>
          </section>

          {cron.args && cron.args.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Arguments</h3>
              <JsonViewer data={cron.args} />
            </section>
          )}

          {cron.meta && Object.keys(cron.meta).length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Metadata</h3>
              <JsonViewer data={cron.meta} />
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

