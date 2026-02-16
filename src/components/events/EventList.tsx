import type { OJSEvent } from '@/api/types';
import { timeAgo } from '@/lib/formatting';

interface EventListProps {
  events: OJSEvent[];
}

const eventTypeColor = (type: string) => {
  if (type.startsWith('job.completed')) return 'text-green-600 bg-green-50 dark:bg-green-950';
  if (type.startsWith('job.failed') || type.startsWith('job.discarded')) return 'text-red-600 bg-red-50 dark:bg-red-950';
  if (type.startsWith('job.')) return 'text-blue-600 bg-blue-50 dark:bg-blue-950';
  if (type.startsWith('queue.')) return 'text-purple-600 bg-purple-50 dark:bg-purple-950';
  if (type.startsWith('worker.')) return 'text-amber-600 bg-amber-50 dark:bg-amber-950';
  if (type.startsWith('workflow.')) return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950';
  if (type.startsWith('cron.')) return 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950';
  return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
};

export function EventList({ events }: EventListProps) {
  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className={`rounded-lg border border-gray-200 dark:border-gray-800 p-3 text-sm ${eventTypeColor(event.type)}`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium font-mono text-xs">{event.type}</span>
            <span className="text-xs text-gray-500">{timeAgo(event.timestamp)}</span>
          </div>
          {Object.keys(event.data).length > 0 && (
            <div className="mt-1.5 text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
              {Object.entries(event.data).slice(0, 5).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-gray-500">{k}:</span>
                  <span className="font-mono truncate">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                </div>
              ))}
              {Object.keys(event.data).length > 5 && (
                <div className="text-gray-400">+{Object.keys(event.data).length - 5} more fields</div>
              )}
            </div>
          )}
        </div>
      ))}
      {events.length === 0 && (
        <p className="text-center py-8 text-gray-500 text-sm">No events recorded.</p>
      )}
    </div>
  );
}
