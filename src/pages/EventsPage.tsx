import { useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { EventList } from '@/components/events/EventList';
import { Pagination } from '@/components/common/Pagination';
import type { PaginatedResponse, OJSEvent } from '@/api/types';

const EVENT_TYPES = [
  'job.enqueued', 'job.started', 'job.completed', 'job.failed', 'job.retried', 'job.cancelled', 'job.discarded',
  'queue.paused', 'queue.resumed', 'worker.registered', 'worker.deregistered', 'worker.stale',
  'workflow.started', 'workflow.completed', 'workflow.failed',
  'cron.triggered',
];

export function EventsPage() {
  const client = useClient();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const fetchEvents = useCallback(
    () => client.events({ type: typeFilter, page, per_page: 50 }),
    [client, typeFilter, page],
  );
  const { data: eventsResp, refresh } = usePolling<PaginatedResponse<OJSEvent>>(fetchEvents, 3000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Event Stream</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={typeFilter ?? ''}
          onChange={(e) => { setTypeFilter(e.target.value || undefined); setPage(1); }}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800"
        >
          <option value="">All event types</option>
          {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {typeFilter && (
          <button onClick={() => setTypeFilter(undefined)} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Clear filter
          </button>
        )}
      </div>

      <EventList events={eventsResp?.items ?? []} />

      {eventsResp && (
        <Pagination
          page={eventsResp.pagination.page}
          perPage={eventsResp.pagination.per_page}
          total={eventsResp.pagination.total}
          onChange={setPage}
        />
      )}
    </div>
  );
}
