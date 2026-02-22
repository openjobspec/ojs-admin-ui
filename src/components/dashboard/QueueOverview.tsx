import { useState } from 'react';
import type { QueueSummary } from '@/api/types';
import { formatNumber, formatRate } from '@/lib/formatting';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Link } from 'react-router-dom';

const INITIAL_DISPLAY = 6;

export function QueueOverview({ queues }: { queues: QueueSummary[] }) {
  const [showAll, setShowAll] = useState(false);

  if (queues.length === 0) {
    return <p className="text-sm text-gray-500">No queues found.</p>;
  }

  const displayed = showAll ? queues : queues.slice(0, INITIAL_DISPLAY);
  const hasMore = queues.length > INITIAL_DISPLAY;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map((q) => {
          const total = q.counts.available + q.counts.active + q.counts.scheduled + q.counts.retryable;
          return (
            <Link
              key={q.name}
              to={`/queues?name=${q.name}`}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">{q.name}</span>
                {q.paused && <StatusBadge state="cancelled" />}
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatNumber(total)}</div>
              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                <span className="text-blue-600">{q.counts.available} ready</span>
                <span className="text-amber-600">{q.counts.active} active</span>
                {q.counts.retryable > 0 && <span className="text-orange-600">{q.counts.retryable} retrying</span>}
              </div>
              {q.throughput && (
                <div className="text-xs text-gray-400 mt-1">{formatRate(q.throughput.processed_per_minute)} processed</div>
              )}
            </Link>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {showAll ? 'Show less' : `View all ${queues.length} queues`}
        </button>
      )}
    </div>
  );
}

