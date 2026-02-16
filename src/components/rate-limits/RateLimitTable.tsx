import { useState } from 'react';
import type { RateLimitInfo } from '@/api/types';
import { useClient } from '@/hooks/useAppContext';

interface RateLimitTableProps {
  rateLimits: RateLimitInfo[];
  onRefresh: () => void;
}

export function RateLimitTable({ rateLimits, onRefresh }: RateLimitTableProps) {
  const client = useClient();
  const [overrideTarget, setOverrideTarget] = useState<RateLimitInfo | null>(null);
  const [overrideLimit, setOverrideLimit] = useState('');
  const [overridePeriod, setOverridePeriod] = useState('1m');
  const [acting, setActing] = useState<string | null>(null);

  const handleOverride = async () => {
    if (!overrideTarget || !overrideLimit) return;
    setActing(overrideTarget.key);
    try {
      await client.overrideRateLimit(overrideTarget.key, Number(overrideLimit), overridePeriod);
      setOverrideTarget(null);
      setOverrideLimit('');
      onRefresh();
    } finally {
      setActing(null);
    }
  };

  const handleRemoveOverride = async (key: string) => {
    setActing(key);
    try {
      await client.deleteRateLimitOverride(key);
      onRefresh();
    } finally {
      setActing(null);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Key</th>
              <th className="text-right px-3 py-3">Limit</th>
              <th className="text-right px-3 py-3">Period</th>
              <th className="text-right px-3 py-3">Active</th>
              <th className="text-right px-3 py-3">Waiting</th>
              <th className="text-center px-3 py-3">Override</th>
              <th className="text-center px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rateLimits.map((rl) => (
              <tr key={rl.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3 font-mono text-xs">{rl.key}</td>
                <td className="px-3 py-3 text-right">{rl.limit}</td>
                <td className="px-3 py-3 text-right text-gray-500">{rl.period}</td>
                <td className="px-3 py-3 text-right">
                  <span className={rl.active >= rl.limit ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {rl.active}
                  </span>
                </td>
                <td className="px-3 py-3 text-right text-gray-500">{rl.waiting}</td>
                <td className="px-3 py-3 text-center">
                  {rl.override ? (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full">
                      {rl.override.limit}/{rl.override.period}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={() => { setOverrideTarget(rl); setOverrideLimit(String(rl.limit)); setOverridePeriod(rl.period); }}
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Override
                    </button>
                    {rl.override && (
                      <button
                        onClick={() => handleRemoveOverride(rl.key)}
                        disabled={acting === rl.key}
                        className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40"
                      >
                        {acting === rl.key ? '…' : 'Remove'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rateLimits.length === 0 && (
          <p className="text-center py-8 text-gray-500 text-sm">No active rate limits.</p>
        )}
      </div>

      {/* Override Modal */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOverrideTarget(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Override Rate Limit</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Override limit for <span className="font-mono">{overrideTarget.key}</span>
            </p>
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Limit</label>
                <input
                  type="number"
                  value={overrideLimit}
                  onChange={(e) => setOverrideLimit(e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
                  min="0"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Period</label>
                <select
                  value={overridePeriod}
                  onChange={(e) => setOverridePeriod(e.target.value)}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-900"
                >
                  <option value="1s">1 second</option>
                  <option value="10s">10 seconds</option>
                  <option value="1m">1 minute</option>
                  <option value="5m">5 minutes</option>
                  <option value="1h">1 hour</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOverrideTarget(null)}
                className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleOverride}
                disabled={acting !== null || !overrideLimit}
                className="px-4 py-2 text-sm rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {acting ? 'Saving…' : 'Apply Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
