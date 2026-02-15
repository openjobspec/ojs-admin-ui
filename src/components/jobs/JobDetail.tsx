import { useEffect, useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { useKeyboard } from '@/hooks/useKeyboard';
import type { JobDetail as JobDetailType } from '@/api/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { JsonViewer } from '@/components/common/JsonViewer';
import { timeAgo } from '@/lib/formatting';

interface JobDetailProps {
  jobId: string;
  onClose: () => void;
}

export function JobDetail({ jobId, onClose }: JobDetailProps) {
  const client = useClient();
  const [job, setJob] = useState<JobDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useKeyboard('Escape', onClose);

  const load = useCallback(async () => {
    try { setJob(await client.job(jobId)); }
    catch (e) { setError(String(e)); }
  }, [client, jobId]);

  useEffect(() => { load(); }, [load]);

  const handleRetry = async () => { await client.retryJob(jobId); load(); };
  const handleCancel = async () => { await client.cancelJob(jobId); load(); };

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!job) return <div className="p-4 text-gray-500">Loading…</div>;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{job.type}</h2>
            <p className="text-xs text-gray-500 font-mono">{job.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Status + Actions */}
          <div className="flex items-center gap-3">
            <StatusBadge state={job.state} />
            <span className="text-sm text-gray-500">Attempt {job.attempt}{job.max_attempts ? ` / ${job.max_attempts}` : ''}</span>
            <span className="text-xs text-gray-400">{timeAgo(job.created_at)}</span>
            <div className="flex-1" />
            {['discarded', 'cancelled'].includes(job.state) && (
              <button onClick={handleRetry} className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Retry</button>
            )}
            {['available', 'scheduled', 'pending', 'retryable'].includes(job.state) && (
              <button onClick={handleCancel} className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Cancel</button>
            )}
          </div>

          {/* Timestamps */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Timeline</h3>
            <div className="space-y-1 text-xs">
              {job.metadata?.created_at && <Row label="Created" value={job.metadata.created_at} />}
              {job.metadata?.enqueued_at && <Row label="Enqueued" value={job.metadata.enqueued_at} />}
              {job.metadata?.started_at && <Row label="Started" value={job.metadata.started_at} />}
              {job.metadata?.completed_at && <Row label="Completed" value={job.metadata.completed_at} />}
              {job.metadata?.cancelled_at && <Row label="Cancelled" value={job.metadata.cancelled_at} />}
              {job.metadata?.discarded_at && <Row label="Discarded" value={job.metadata.discarded_at} />}
            </div>
          </section>

          {/* Args */}
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Arguments</h3>
            <JsonViewer data={job.args} />
          </section>

          {/* Meta */}
          {Object.keys(job.meta).length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Metadata</h3>
              <JsonViewer data={job.meta} />
            </section>
          )}

          {/* Errors */}
          {job.errors.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Error History</h3>
              <div className="space-y-2">
                {job.errors.map((err, i) => (
                  <div key={i} className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium text-red-700 dark:text-red-400">{err.code}{err.type ? ` (${err.type})` : ''}</span>
                      <span className="text-gray-500">Attempt {err.attempt} · {timeAgo(err.occurred_at)}</span>
                    </div>
                    <p className="mt-1 text-red-600 dark:text-red-300">{err.message}</p>
                    {err.backtrace && (
                      <pre className="mt-1 text-gray-500 text-[10px] overflow-auto max-h-24">
                        {err.backtrace.join('\n')}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Result */}
          {job.result != null && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Result</h3>
              <JsonViewer data={job.result} />
            </section>
          )}

          {/* Retry Policy */}
          {job.retry_policy && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Retry Policy</h3>
              <JsonViewer data={job.retry_policy} />
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
      <span className="font-mono">{new Date(value).toLocaleString()}</span>
    </div>
  );
}
