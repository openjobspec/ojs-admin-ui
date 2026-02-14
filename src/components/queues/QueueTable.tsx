import { useState } from 'react';
import type { QueueSummary } from '@/api/types';
import { useClient } from '@/hooks/useAppContext';
import { formatNumber, formatRate } from '@/lib/formatting';

interface QueueTableProps {
  queues: QueueSummary[];
  onRefresh: () => void;
}

export function QueueTable({ queues, onRefresh }: QueueTableProps) {
  const client = useClient();
  const [acting, setActing] = useState<string | null>(null);

  const togglePause = async (q: QueueSummary) => {
    setActing(q.name);
    try {
      if (q.paused) await client.resumeQueue(q.name);
      else await client.pauseQueue(q.name);
      onRefresh();
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">Queue</th>
            <th className="text-right px-3 py-3">Available</th>
            <th className="text-right px-3 py-3">Active</th>
            <th className="text-right px-3 py-3">Scheduled</th>
            <th className="text-right px-3 py-3">Retrying</th>
            <th className="text-right px-3 py-3">Completed</th>
            <th className="text-right px-3 py-3">Failed</th>
            <th className="text-right px-3 py-3">Throughput</th>
            <th className="text-center px-3 py-3">Status</th>
            <th className="text-center px-3 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {queues.map((q) => (
            <tr key={q.name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3 font-medium">{q.name}</td>
              <td className="px-3 py-3 text-right text-blue-600">{formatNumber(q.counts.available)}</td>
              <td className="px-3 py-3 text-right text-amber-600">{formatNumber(q.counts.active)}</td>
              <td className="px-3 py-3 text-right text-purple-600">{formatNumber(q.counts.scheduled)}</td>
              <td className="px-3 py-3 text-right text-orange-600">{formatNumber(q.counts.retryable)}</td>
              <td className="px-3 py-3 text-right text-green-600">{formatNumber(q.counts.completed)}</td>
              <td className="px-3 py-3 text-right text-red-600">{formatNumber(q.counts.discarded)}</td>
              <td className="px-3 py-3 text-right text-gray-500">
                {q.throughput ? formatRate(q.throughput.processed_per_minute) : '—'}
              </td>
              <td className="px-3 py-3 text-center">
                {q.paused ? (
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">Paused</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">Active</span>
                )}
              </td>
              <td className="px-3 py-3 text-center">
                <button
                  onClick={() => togglePause(q)}
                  disabled={acting === q.name}
                  className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                >
                  {acting === q.name ? '…' : q.paused ? 'Resume' : 'Pause'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {queues.length === 0 && (
        <p className="text-center py-8 text-gray-500 text-sm">No queues found.</p>
      )}
    </div>
  );
}
