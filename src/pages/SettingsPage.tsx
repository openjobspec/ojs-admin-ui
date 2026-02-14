import { useManifest } from '@/hooks/useAppContext';
import { conformanceBadge } from '@/api/manifest';
import { JsonViewer } from '@/components/common/JsonViewer';

export function SettingsPage() {
  const manifest = useManifest();

  if (!manifest) return <p className="text-gray-500">Loading manifest…</p>;

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

      {/* Raw Manifest */}
      <section>
        <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">Raw Manifest</h2>
        <JsonViewer data={manifest} />
      </section>
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
