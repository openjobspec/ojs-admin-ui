import { MirrorDashboard } from '@/components/mirror';
import type { MirrorOverview } from '@/components/mirror';

// Placeholder page: in production this hooks into usePolling + the mirror API.
// For now, renders the MirrorDashboard with mock data for development.
export function MirrorPage() {
  // TODO: Replace with real API call via useClient().mirror()
  const mockOverview: MirrorOverview = {
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
      <h1 className="text-lg font-bold mb-4">OJS Mirror</h1>
      <p className="text-sm text-gray-500 mb-6">
        Live bidirectional bridge to legacy queues. Configure observe, shadow, or split modes.
      </p>
      <MirrorDashboard overview={mockOverview} />
    </div>
  );
}
