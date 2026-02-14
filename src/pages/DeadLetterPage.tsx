import { useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { DeadLetterList } from '@/components/dead-letter/DeadLetterList';
import { JobDetail } from '@/components/jobs/JobDetail';
import { Pagination } from '@/components/common/Pagination';
import type { PaginatedResponse, JobSummary, DeadLetterStats } from '@/api/types';

export function DeadLetterPage() {
  const client = useClient();
  const [page, setPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const fetchDLQ = useCallback(() => client.deadLetter({ page, per_page: 25 }), [client, page]);
  const fetchStats = useCallback(() => client.deadLetterStats().catch(() => null), [client]);

  const { data: dlqResp, refresh } = usePolling<PaginatedResponse<JobSummary>>(fetchDLQ);
  const { data: stats } = usePolling<DeadLetterStats | null>(fetchStats, 15000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Dead Letter Queue</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <DeadLetterList
        jobs={dlqResp?.items ?? []}
        stats={stats ?? null}
        onRefresh={refresh}
        onSelect={setSelectedJob}
      />

      {dlqResp && (
        <Pagination
          page={dlqResp.pagination.page}
          perPage={dlqResp.pagination.per_page}
          total={dlqResp.pagination.total}
          onChange={setPage}
        />
      )}

      {selectedJob && <JobDetail jobId={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
}
