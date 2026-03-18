import type { MirrorQueue } from './types';

interface QueueCardProps {
  queue: MirrorQueue;
  onSetPercent?: (name: string, pct: number) => void;
  onRollback?: (name: string) => void;
}

const modeColors: Record<string, string> = {
  observe: 'bg-blue-100 text-blue-800',
  shadow: 'bg-yellow-100 text-yellow-800',
  split: 'bg-green-100 text-green-800',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500',
  paused: 'bg-gray-400',
  error: 'bg-red-500',
};

export function QueueCard({ queue, onSetPercent, onRollback }: QueueCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${statusColors[queue.status] ?? 'bg-gray-400'}`} />
          <h3 className="font-semibold text-sm">{queue.name}</h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${modeColors[queue.mode] ?? 'bg-gray-100'}`}>
          {queue.mode}
        </span>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        Connector: <span className="font-mono">{queue.connector}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Throughput</span>
          <p className="font-semibold">{queue.throughput.toFixed(1)} jobs/s</p>
        </div>
        <div>
          <span className="text-gray-500">Mirrored</span>
          <p className="font-semibold">{queue.mirrored.toLocaleString()}</p>
        </div>
        <div>
          <span className="text-gray-500">Latency</span>
          <p className="font-semibold">{queue.latencyMs}ms</p>
        </div>
        <div>
          <span className="text-gray-500">Divergence</span>
          <p className={`font-semibold ${queue.divergence > 0 ? 'text-red-600' : ''}`}>
            {queue.divergence}
          </p>
        </div>
      </div>

      {queue.mode === 'split' && queue.splitPercent !== undefined && (
        <div className="mt-3 border-t pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Split to OJS</span>
            <span className="font-semibold">{queue.splitPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${queue.splitPercent}%` }}
            />
          </div>
          {onSetPercent && (
            <div className="flex gap-1 mt-2">
              {[1, 5, 25, 50, 100].map((pct) => (
                <button
                  key={pct}
                  onClick={() => onSetPercent(queue.name, pct)}
                  className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200"
                >
                  {pct}%
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {queue.autoRolledBack && (
        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
          ⚠ Auto-rolled back: {queue.rollbackReason}
          {onRollback && (
            <button
              onClick={() => onRollback(queue.name)}
              className="ml-2 underline"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
