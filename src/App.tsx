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
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  );
}
