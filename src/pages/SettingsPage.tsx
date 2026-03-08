import { useCallback, useState } from 'react';
import { useManifest, useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { conformanceBadge } from '@/api/manifest';
import { JsonViewer } from '@/components/common/JsonViewer';
import { MiddlewareList } from '@/components/settings/MiddlewareList';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import type { MaintenanceStatus, MiddlewareEntry } from '@/api/types';

export function SettingsPage() {
  const manifest = useManifest();
  const client = useClient();
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');

  const fetchMiddleware = useCallback(
    () => client.middleware().catch((err) => { console.warn('Failed to load middleware:', err); return { enqueue: [], execution: [] }; }),
    [client],
  );
  const fetchMaintenance = useCallback(
    () => client.maintenanceStatus().catch(() => null),
    [client],
  );
  const { data: middleware } = usePolling<{ enqueue: MiddlewareEntry[]; execution: MiddlewareEntry[] }>(fetchMiddleware, 30000);
  const { data: maintenance, refresh: refreshMaintenance } = usePolling<MaintenanceStatus | null>(fetchMaintenance, 10000);

  if (!manifest) return <p className="text-gray-500" role="status" aria-live="polite">Loading manifest…</p>;

  const extensions = manifest.extensions;
  const officialExts = extensions && !Array.isArray(extensions) ? extensions.official ?? [] : [];
  const experimentalExts = extensions && !Array.isArray(extensions) ? extensions.experimental ?? [] : [];
  const legacyExts = Array.isArray(extensions) ? extensions : [];

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold">Settings & Backend Info</h1>

      {/* Implementation */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">Implementation</h2>
        <Row label="Name" value={manifest.implementation.name} />
        <Row label="Version" value={manifest.implementation.version} />
        <Row label="Language" value={manifest.implementation.language} />
        <Row label="Backend" value={manifest.backend} />
        <Row label="Conformance" value={conformanceBadge(manifest.conformance_level)} />
        {manifest.conformance_tier && <Row label="Tier" value={manifest.conformance_tier} />}
        <Row label="Protocols" value={manifest.protocols.join(', ')} />
      </section>

      {/* Maintenance Mode */}
      <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">Maintenance Mode</h2>
          {maintenance?.enabled ? (
            <button
              onClick={async () => { await client.setMaintenance(false); refreshMaintenance(); }}
              className="text-xs px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Disable Maintenance
            </button>
          ) : (
            <button
              onClick={() => setShowMaintenanceModal(true)}
              className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              Enable Maintenance
            </button>
          )}
        </div>
        {maintenance?.enabled && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-3 text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-200">Maintenance mode is active</p>
            {maintenance.reason && <p className="text-amber-700 dark:text-amber-300 mt-1">{maintenance.reason}</p>}
          </div>
        )}
        {!maintenance?.enabled && (
          <p className="text-sm text-gray-500">System is operating normally. Enable maintenance mode to stop processing new jobs.</p>
        )}
      </section>

      {/* Capabilities */}
      {manifest.capabilities && (
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">Capabilities</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {Object.entries(manifest.capabilities).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={val ? 'text-green-600' : 'text-gray-400'}>{val ? '✓' : '✗'}</span>
                <span className="text-gray-700 dark:text-gray-300">{key.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Extensions */}
      {(officialExts.length > 0 || experimentalExts.length > 0 || legacyExts.length > 0) && (
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase">Extensions</h2>
          {officialExts.map((e) => (
            <div key={e.uri} className="flex items-center gap-2 text-sm">
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">Official</span>
              <span>{e.name}</span>
              <span className="text-gray-400 text-xs">v{e.version}</span>
            </div>
          ))}
          {experimentalExts.map((e) => (
            <div key={e.uri} className="flex items-center gap-2 text-sm">
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">Experimental</span>
              <span>{e.name}</span>
              <span className="text-gray-400 text-xs">v{e.version}</span>
            </div>
          ))}
          {legacyExts.map((e) => (
            <div key={e} className="text-sm text-gray-600">{e}</div>
          ))}
        </section>
      )}

      {/* Middleware */}
      {middleware && (
        <section className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-3">Middleware</h2>
          <MiddlewareList enqueue={middleware.enqueue} execution={middleware.execution} />
        </section>
      )}

      {/* Raw Manifest */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Raw Manifest</h2>
        <JsonViewer data={manifest} />
      </section>

      {/* Maintenance Mode Modal */}
      <ConfirmModal
        open={showMaintenanceModal}
        title="Enable Maintenance Mode"
        message="This will stop the server from accepting new jobs. Active jobs will continue to completion."
        confirmLabel="Enable"
        onConfirm={async () => {
          await client.setMaintenance(true, maintenanceReason || undefined);
          setShowMaintenanceModal(false);
          setMaintenanceReason('');
          refreshMaintenance();
        }}
        onCancel={() => { setShowMaintenanceModal(false); setMaintenanceReason(''); }}
      >
        <label className="block text-sm text-gray-600 dark:text-gray-400 mt-3">
          Reason (optional)
          <input
            type="text"
            value={maintenanceReason}
            onChange={(e) => setMaintenanceReason(e.target.value)}
            placeholder="e.g., Database migration in progress"
            className="mt-1 block w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          />
        </label>
      </ConfirmModal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
