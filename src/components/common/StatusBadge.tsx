import type { JobState } from '@/api/types';
import { STATE_BG } from '@/lib/colors';

export function StatusBadge({ state }: { state: JobState | string }) {
  const bg = STATE_BG[state as JobState] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg}`} role="status" aria-label={`Job state: ${state}`}>
      {state === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot mr-1" aria-hidden="true" />}
      {state}
    </span>
  );
}
