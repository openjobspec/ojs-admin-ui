import type { MirrorOverview } from './types';
import { QueueCard } from './QueueCard';
import { ReconcilerView } from './ReconcilerView';

interface MirrorDashboardProps {
  overview: MirrorOverview | null;
  loading?: boolean;
  error?: string;
  onSetPercent?: (name: string, pct: number) => void;
  onRollback?: (name: string) => void;
}

export function MirrorDashboard({ overview, loading, error, onSetPercent, onRollback }: MirrorDashboardProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-700 text-sm">
        Failed to load mirror data: {error}
      </div>
    );
  }

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-gray-400 text-sm">Loading mirror data…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-2xl font-bold">{overview.queues.length}</p>
          <p className="text-xs text-gray-500">Mirrored Queues</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-2xl font-bold">{overview.totalMirrored.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Jobs Mirrored</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <p className={`text-2xl font-bold ${overview.totalDivergence > 0 ? 'text-red-600' : ''}`}>
            {overview.totalDivergence}
          </p>
          <p className="text-xs text-gray-500">Divergence Events</p>
        </div>
      </div>

      {/* Reconciler */}
      <ReconcilerView status={overview.reconciler} />

      {/* Queue cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3">Mirrored Queues</h2>
        {overview.queues.length === 0 ? (
          <p className="text-xs text-gray-400">No mirrored queues configured</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overview.queues.map((q) => (
              <QueueCard
                key={q.name}
                queue={q}
                onSetPercent={onSetPercent}
                onRollback={onRollback}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
