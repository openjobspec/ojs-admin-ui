import { useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { RateLimitTable } from '@/components/rate-limits/RateLimitTable';
import { Pagination } from '@/components/common/Pagination';
import type { PaginatedResponse, RateLimitInfo } from '@/api/types';

export function RateLimitsPage() {
  const client = useClient();
  const [page, setPage] = useState(1);

  const fetchLimits = useCallback(() => client.rateLimits(page, 25), [client, page]);
  const { data: limitsResp, refresh } = usePolling<PaginatedResponse<RateLimitInfo>>(fetchLimits, 5000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Rate Limits</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <RateLimitTable
        rateLimits={limitsResp?.items ?? []}
        onRefresh={refresh}
      />

      {limitsResp && (
        <Pagination
          page={limitsResp.pagination.page}
          perPage={limitsResp.pagination.per_page}
          total={limitsResp.pagination.total}
          onChange={setPage}
        />
      )}
    </div>
  );
}
