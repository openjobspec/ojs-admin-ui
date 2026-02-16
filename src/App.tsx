import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/shell/Layout';
import { AppContext } from '@/hooks/useAppContext';
import { OJSAdminClient } from '@/api/client';
import type { OJSManifest } from '@/api/types';
import { DashboardPage } from '@/pages/DashboardPage';
import { QueuesPage } from '@/pages/QueuesPage';
import { JobsPage } from '@/pages/JobsPage';
import { WorkersPage } from '@/pages/WorkersPage';
import { DeadLetterPage } from '@/pages/DeadLetterPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { CronsPage } from '@/pages/CronsPage';
import { WorkflowsPage } from '@/pages/WorkflowsPage';
import { WorkflowBuilderPage } from '@/pages/WorkflowBuilderPage';
import { RateLimitsPage } from '@/pages/RateLimitsPage';
import { EventsPage } from '@/pages/EventsPage';
import { UniqueJobsPage } from '@/pages/UniqueJobsPage';
import { ScheduledJobsPage } from '@/pages/ScheduledJobsPage';
import { AuditLogPage } from '@/pages/AuditLogPage';
import { WebhooksPage } from '@/pages/WebhooksPage';
import { TenantsPage } from '@/pages/TenantsPage';
import { PoolsPage } from '@/pages/PoolsPage';
import { SchemasPage } from '@/pages/SchemasPage';

interface AppProps {
  baseUrl?: string;
  basename?: string;
}

export function App({ baseUrl = '', basename = '/ojs/admin' }: AppProps) {
  const [client] = useState(() => new OJSAdminClient(baseUrl));
  const [manifest, setManifest] = useState<OJSManifest | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    client.manifest().then((m) => {
      setManifest(m);
      setConnected(true);
    }).catch(() => {
      setConnected(false);
    });
  }, [client]);

  return (
    <AppContext.Provider value={{ client, manifest, baseUrl, connected }}>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="queues" element={<QueuesPage />} />
            <Route path="jobs" element={<JobsPage />} />
            <Route path="workers" element={<WorkersPage />} />
            <Route path="dead-letter" element={<DeadLetterPage />} />
            <Route path="crons" element={<CronsPage />} />
            <Route path="workflows/builder" element={<WorkflowBuilderPage />} />
            <Route path="workflows" element={<WorkflowsPage />} />
            <Route path="rate-limits" element={<RateLimitsPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="unique-jobs" element={<UniqueJobsPage />} />
            <Route path="scheduled" element={<ScheduledJobsPage />} />
            <Route path="audit-log" element={<AuditLogPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="pools" element={<PoolsPage />} />
            <Route path="schemas" element={<SchemasPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
