import { useState, useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { TenantTable } from '@/components/tenants/TenantTable';
import { TenantDetail } from '@/components/tenants/TenantDetail';
import { Pagination } from '@/components/common/Pagination';
import type { PaginatedResponse, Tenant } from '@/api/types';

export function TenantsPage() {
  const client = useClient();
  const [page, setPage] = useState(1);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  const fetchTenants = useCallback(() => client.tenants(page, 25), [client, page]);
  const { data: resp, refresh } = usePolling<PaginatedResponse<Tenant>>(fetchTenants, 10000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tenants</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <TenantTable tenants={resp?.items ?? []} onSelect={setSelectedTenant} />

      {resp && (
        <Pagination
          page={resp.pagination.page}
          perPage={resp.pagination.per_page}
          total={resp.pagination.total}
          onChange={setPage}
        />
      )}

      {selectedTenant && <TenantDetail tenantId={selectedTenant} onClose={() => setSelectedTenant(null)} />}
    </div>
  );
}
