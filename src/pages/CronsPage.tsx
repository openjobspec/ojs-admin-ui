import { useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { CronTable } from '@/components/crons/CronTable';
import { CronDetail } from '@/components/crons/CronDetail';
import { Pagination } from '@/components/common/Pagination';
import type { PaginatedResponse, CronJob } from '@/api/types';

export function CronsPage() {
  const client = useClient();
  const [page, setPage] = useState(1);
  const [selectedCron, setSelectedCron] = useState<string | null>(null);

  const fetchCrons = useCallback(() => client.crons(page, 25), [client, page]);
  const { data: cronsResp, refresh } = usePolling<PaginatedResponse<CronJob>>(fetchCrons, 10000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Cron Jobs</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <CronTable
        crons={cronsResp?.items ?? []}
        onRefresh={refresh}
        onSelect={setSelectedCron}
      />

      {cronsResp && (
        <Pagination
          page={cronsResp.pagination.page}
          perPage={cronsResp.pagination.per_page}
          total={cronsResp.pagination.total}
          onChange={setPage}
        />
      )}

      {selectedCron && <CronDetail cronId={selectedCron} onClose={() => setSelectedCron(null)} />}
    </div>
  );
}
