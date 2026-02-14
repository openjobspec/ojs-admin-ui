import { useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { QueueTable } from '@/components/queues/QueueTable';
import type { QueueSummary } from '@/api/types';

export function QueuesPage() {
  const client = useClient();
  const fetchQueues = useCallback(() => client.queues().then((r) => r.items), [client]);
  const { data: queues, refresh } = usePolling<QueueSummary[]>(fetchQueues);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Queues</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>
      <QueueTable queues={queues ?? []} onRefresh={refresh} />
    </div>
  );
}
