import { useEffect, useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { useKeyboard } from '@/hooks/useKeyboard';
import { usePolling } from '@/hooks/usePolling';
import type { Tenant, PaginatedResponse, JobSummary } from '@/api/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { JsonViewer } from '@/components/common/JsonViewer';
import { formatNumber, timeAgo } from '@/lib/formatting';

interface TenantDetailProps {
  tenantId: string;
  onClose: () => void;
}

export function TenantDetail({ tenantId, onClose }: TenantDetailProps) {
  const client = useClient();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState<string | null>(null);

  useKeyboard('Escape', onClose);

  const load = useCallback(async () => {
    try { setTenant(await client.tenant(tenantId)); }
    catch (e) { setError(String(e)); }
  }, [client, tenantId]);

  useEffect(() => { load(); }, [load]);

  const fetchJobs = useCallback(
    () => client.tenantJobs(tenantId, { per_page: 10 }).catch(() => ({ items: [], pagination: { total: 0, page: 1, per_page: 10 } })),
    [client, tenantId],
  );
  const { data: jobsResp } = usePolling<PaginatedResponse<JobSummary>>(fetchJobs, 10000);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!tenant) return <div className="p-4 text-gray-500">Loading…</div>;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-xl bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{tenant.name}</h2>
            <p className="text-xs text-gray-500 font-mono">{tenant.id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            {tenant.state === 'suspended' ? (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">Suspended</span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">Active</span>
            )}
            <span className="text-xs text-gray-400">Created {timeAgo(tenant.created_at)}</span>
          </div>

          {tenant.limits && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Resource Limits</h3>
              <div className="space-y-1 text-xs">
                {tenant.limits.max_queues != null && <Row label="Max Queues" value={String(tenant.limits.max_queues)} />}
                {tenant.limits.max_jobs_per_second != null && <Row label="Max Jobs/sec" value={String(tenant.limits.max_jobs_per_second)} />}
                {tenant.limits.max_concurrent_jobs != null && <Row label="Max Concurrent" value={String(tenant.limits.max_concurrent_jobs)} />}
              </div>
            </section>
          )}

          {tenant.stats && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Statistics</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center">
                  <div className="text-lg font-bold text-blue-600">{formatNumber(tenant.stats.queues)}</div>
                  <div className="text-xs text-gray-500">Queues</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center">
                  <div className="text-lg font-bold text-amber-600">{formatNumber(tenant.stats.jobs.active)}</div>
                  <div className="text-xs text-gray-500">Active Jobs</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-center">
                  <div className="text-lg font-bold text-green-600">{formatNumber(tenant.stats.workers)}</div>
                  <div className="text-xs text-gray-500">Workers</div>
                </div>
              </div>
              <div className="mt-2">
                <JsonViewer data={tenant.stats.jobs} />
              </div>
            </section>
          )}

          {/* Recent Jobs */}
          {jobsResp && jobsResp.items.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Jobs</h3>
              <div className="space-y-1">
                {jobsResp.items.map((job) => (
                  <div key={job.id} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800 rounded px-2 py-1.5">
                    <StatusBadge state={job.state} />
                    <span className="font-medium">{job.type}</span>
                    <span className="text-gray-400 ml-auto">{timeAgo(job.created_at)}</span>
                  </div>
                ))}
              </div>
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
