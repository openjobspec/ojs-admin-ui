import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { JobTable } from '@/components/jobs/JobTable';
import { JobFilters } from '@/components/jobs/JobFilters';
import { JobDetail } from '@/components/jobs/JobDetail';
import { Pagination } from '@/components/common/Pagination';
import type { PaginatedResponse, JobSummary, QueueSummary } from '@/api/types';

function parseFilters(params: URLSearchParams) {
  return {
    queue: params.get('queue') || undefined,
    state: params.get('state') || undefined,
    type: params.get('type') || undefined,
  };
}

export function JobsPage() {
  const client = useClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseFilters(searchParams);
  const page = Number(searchParams.get('page')) || 1;
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const setFilters = (f: { queue?: string; state?: string; type?: string }) => {
    const next = new URLSearchParams();
    if (f.queue) next.set('queue', f.queue);
    if (f.state) next.set('state', f.state);
    if (f.type) next.set('type', f.type);
    setSearchParams(next, { replace: true });
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    if (p > 1) next.set('page', String(p));
    else next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const fetchJobs = useCallback(
    () => client.jobs({ queue: filters.queue, state: filters.state, type: filters.type, page, per_page: 25 }),
    [client, filters.queue, filters.state, filters.type, page],
  );
  const fetchQueues = useCallback(() => client.queues().then((r) => r.items), [client]);

  const { data: jobsResp, refresh } = usePolling<PaginatedResponse<JobSummary>>(fetchJobs, 5000);
  const { data: queues } = usePolling<QueueSummary[]>(fetchQueues, 30000);

  const queueNames = (queues ?? []).map((q) => q.name);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Jobs</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <JobFilters
        filters={filters}
        queues={queueNames}
        onChange={(f) => setFilters(f)}
      />

      <JobTable jobs={jobsResp?.items ?? []} onSelect={setSelectedJob} />

      {jobsResp && (
        <Pagination
          page={jobsResp.pagination.page}
          perPage={jobsResp.pagination.per_page}
          total={jobsResp.pagination.total}
          onChange={setPage}
        />
      )}

      {selectedJob && <JobDetail jobId={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
