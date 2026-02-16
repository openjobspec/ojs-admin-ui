import type { MiddlewareEntry } from '@/api/types';

interface MiddlewareListProps {
  enqueue: MiddlewareEntry[];
  execution: MiddlewareEntry[];
}

function ChainSection({ title, entries }: { title: string; entries: MiddlewareEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 mb-2">{title}</h4>
      <div className="space-y-1">
        {entries.sort((a, b) => a.order - b.order).map((m, i) => (
          <div key={`${m.name}-${i}`} className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-500">
              {m.order}
            </span>
            <span className="font-medium">{m.name}</span>
            {m.description && <span className="text-xs text-gray-400">— {m.description}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MiddlewareList({ enqueue, execution }: MiddlewareListProps) {
  if (enqueue.length === 0 && execution.length === 0) {
    return <p className="text-sm text-gray-500">No middleware registered.</p>;
  }

  return (
    <div className="space-y-4">
      <ChainSection title="Enqueue Pipeline" entries={enqueue} />
      <ChainSection title="Execution Pipeline" entries={execution} />
    </div>
  );
}
