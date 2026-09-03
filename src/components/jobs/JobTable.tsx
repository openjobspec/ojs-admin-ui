import type { JobSummary } from '@/api/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { timeAgo } from '@/lib/formatting';

interface JobTableProps {
  jobs: JobSummary[];
  onSelect: (id: string) => void;
}

export function JobTable({ jobs, onSelect }: JobTableProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs uppercase">
          <tr>
            <th scope="col" className="text-left px-4 py-3">ID</th>
            <th scope="col" className="text-left px-3 py-3">Type</th>
            <th scope="col" className="text-left px-3 py-3">Queue</th>
            <th scope="col" className="text-center px-3 py-3">State</th>
            <th scope="col" className="text-center px-3 py-3">Attempt</th>
            <th scope="col" className="text-right px-4 py-3">Created</th>
            <th scope="col" className="text-center px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{job.id.substring(0, 12)}…</td>
              <td className="px-3 py-3 font-medium">{job.type}</td>
              <td className="px-3 py-3 text-gray-500">{job.queue}</td>
              <td className="px-3 py-3 text-center"><StatusBadge state={job.state} /></td>
              <td className="px-3 py-3 text-center text-gray-500">{job.attempt}</td>
              <td className="px-4 py-3 text-right text-gray-500 text-xs">{timeAgo(job.created_at)}</td>
              <td className="px-4 py-2 text-center">
                <button
                  type="button"
                  onClick={() => onSelect(job.id)}
                  aria-label={`View details for ${job.type} job ${job.id}`}
                  className="inline-flex min-h-10 items-center rounded px-3 text-xs font-medium text-blue-700 hover:bg-blue-50 hover:text-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:bg-blue-950"
                >
                  View details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {jobs.length === 0 && (
        <p className="text-center py-8 text-gray-500 text-sm">No jobs found matching filters.</p>
      )}
    </div>
  );
}
