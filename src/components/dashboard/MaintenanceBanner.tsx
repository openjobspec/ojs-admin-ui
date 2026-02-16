import { useState } from 'react';
import { useClient } from '@/hooks/useAppContext';
import type { MaintenanceStatus } from '@/api/types';
import { formatDuration } from '@/lib/formatting';

interface MaintenanceBannerProps {
  status: MaintenanceStatus | null;
  onToggle: () => void;
}

export function MaintenanceBanner({ status, onToggle }: MaintenanceBannerProps) {
  const client = useClient();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');
  const [acting, setActing] = useState(false);

  if (!status) return null;

  const handleEnable = async () => {
    setActing(true);
    try {
      await client.setMaintenance(true, reason || undefined, duration || undefined);
      setShowModal(false);
      setReason('');
      setDuration('');
      onToggle();
    } finally {
      setActing(false);
    }
  };

  const handleDisable = async () => {
    setActing(true);
    try {
      await client.setMaintenance(false);
      onToggle();
    } finally {
      setActing(false);
    }
  };

  if (status.enabled) {
    const elapsed = status.started_at
      ? Math.round((Date.now() - new Date(status.started_at).getTime()) / 1000)
      : null;

    return (
      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-4">
        <span className="text-2xl">🔧</span>
        <div className="flex-1">
          <div className="font-semibold text-amber-800 dark:text-amber-200">Maintenance Mode Active</div>
          <div className="text-sm text-amber-700 dark:text-amber-300">
            {status.reason && <span>{status.reason} · </span>}
            {elapsed != null && <span>Active for {formatDuration(elapsed)}</span>}
            {status.ends_at && <span> · Ends {new Date(status.ends_at).toLocaleString()}</span>}
          </div>
        </div>
        <button
          onClick={handleDisable}
          disabled={acting}
          className="px-4 py-2 text-sm rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {acting ? 'Disabling…' : 'Disable Maintenance'}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="text-xs px-3 py-1.5 border border-amber-300 text-amber-700 dark:text-amber-400 rounded hover:bg-amber-50 dark:hover:bg-amber-950"
        >
          🔧 Enable Maintenance
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Enable Maintenance Mode</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This will pause all job processing. Active jobs will finish but no new jobs will be fetched.
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Database migration"
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Duration (optional)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
                >
                  <option value="">Until manually disabled</option>
                  <option value="15m">15 minutes</option>
                  <option value="30m">30 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="2h">2 hours</option>
                  <option value="4h">4 hours</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleEnable}
                disabled={acting}
                className="px-4 py-2 text-sm rounded text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
              >
                {acting ? 'Enabling…' : 'Enable Maintenance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
