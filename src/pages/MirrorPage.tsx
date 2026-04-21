import { MirrorDashboard } from '@/components/mirror';
import type { MirrorOverview } from '@/components/mirror';

/**
 * Mirror dashboard page — part of OJS Labs.
 *
 * In production this hooks into usePolling + the mirror API.
 * For now, renders the MirrorDashboard with empty data and a Labs banner.
 * Wire to the ojs-mirror API once it reaches P2.
 */
export function MirrorPage() {
  const emptyOverview: MirrorOverview = {
    queues: [],
    reconciler: {
      windowCount: 0,
      matchCount: 0,
      driftCount: 0,
      driftRate: 0,
      alertActive: false,
      lastCheck: new Date().toISOString(),
    },
    totalMirrored: 0,
    totalDivergence: 0,
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-lg font-bold">OJS Mirror</h1>
        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          Labs
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Live bidirectional bridge to legacy queues. Configure observe, shadow, or split modes.
        Connect an ojs-mirror instance to see live data.
      </p>
      <MirrorDashboard overview={emptyOverview} />
    </div>
  );
}
