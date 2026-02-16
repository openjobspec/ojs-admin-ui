import type { PriorityStats } from '@/api/types';
import { formatNumber } from '@/lib/formatting';

interface PriorityDistributionProps {
  stats: PriorityStats | null;
}

export function PriorityDistribution({ stats }: PriorityDistributionProps) {
  if (!stats || stats.distribution.length === 0) return null;

  const maxCount = Math.max(...stats.distribution.map((d) => d.count), 1);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase">Priority Distribution</h3>
      <div className="space-y-1">
        {stats.distribution.sort((a, b) => b.priority - a.priority).map((d) => (
          <div key={d.priority} className="flex items-center gap-2 text-xs">
            <span className="w-8 text-right text-gray-500 font-mono">P{d.priority}</span>
            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded"
                style={{ width: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-12 text-right text-gray-500">{formatNumber(d.count)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
