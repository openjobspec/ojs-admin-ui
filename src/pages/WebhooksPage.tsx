import { useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { WebhookTable } from '@/components/webhooks/WebhookTable';
import { WebhookDetail } from '@/components/webhooks/WebhookDetail';
import { CreateWebhookModal } from '@/components/webhooks/CreateWebhookModal';
import { Pagination } from '@/components/common/Pagination';
import type { PaginatedResponse, WebhookSubscription } from '@/api/types';

export function WebhooksPage() {
  const client = useClient();
  const [page, setPage] = useState(1);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchWebhooks = useCallback(() => client.webhooks(page, 25), [client, page]);
  const { data: resp, refresh } = usePolling<PaginatedResponse<WebhookSubscription>>(fetchWebhooks, 10000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Webhooks</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            + New Webhook
          </button>
          <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            Refresh
          </button>
        </div>
      </div>

      <WebhookTable
        webhooks={resp?.items ?? []}
        onRefresh={refresh}
        onSelect={setSelectedWebhook}
      />

      {resp && (
        <Pagination
          page={resp.pagination.page}
          perPage={resp.pagination.per_page}
          total={resp.pagination.total}
          onChange={setPage}
        />
      )}

      {selectedWebhook && <WebhookDetail webhookId={selectedWebhook} onClose={() => setSelectedWebhook(null)} />}
      {showCreate && <CreateWebhookModal onClose={() => setShowCreate(false)} onCreated={refresh} />}
    </div>
  );
}
