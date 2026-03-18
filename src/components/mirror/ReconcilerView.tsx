import type { MirrorReconcilerStatus } from './types';

interface ReconcilerViewProps {
  status: MirrorReconcilerStatus | null;
}

export function ReconcilerView({ status }: ReconcilerViewProps) {
  if (!status) {
    return (
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-sm mb-2">Reconciler</h3>
        <p className="text-xs text-gray-400">No reconciler data available</p>
      </div>
    );
  }

  const driftPct = status.windowCount > 0
    ? ((status.driftCount / status.windowCount) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Reconciler</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          status.alertActive
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {status.alertActive ? '⚠ Alert' : '✓ OK'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <span className="text-gray-500">Windows Checked</span>
          <p className="font-semibold">{status.windowCount}</p>
        </div>
        <div>
          <span className="text-gray-500">Matched</span>
          <p className="font-semibold text-green-600">{status.matchCount}</p>
        </div>
        <div>
          <span className="text-gray-500">Drifted</span>
          <p className={`font-semibold ${status.driftCount > 0 ? 'text-red-600' : ''}`}>
            {status.driftCount} ({driftPct}%)
          </p>
        </div>
      </div>

      {status.alertActive && status.alertMessage && (
        <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
          {status.alertMessage}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-400">
        Last check: {new Date(status.lastCheck).toLocaleString()}
      </div>
    </div>
  );
}
