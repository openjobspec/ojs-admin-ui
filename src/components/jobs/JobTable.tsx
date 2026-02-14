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
            <th className="text-left px-4 py-3">ID</th>
            <th className="text-left px-3 py-3">Type</th>
            <th className="text-left px-3 py-3">Queue</th>
            <th className="text-center px-3 py-3">State</th>
            <th className="text-center px-3 py-3">Attempt</th>
            <th className="text-right px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {jobs.map((job) => (
            <tr
              key={job.id}
              onClick={() => onSelect(job.id)}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
            >
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{job.id.substring(0, 12)}…</td>
              <td className="px-3 py-3 font-medium">{job.type}</td>
              <td className="px-3 py-3 text-gray-500">{job.queue}</td>
              <td className="px-3 py-3 text-center"><StatusBadge state={job.state} /></td>
              <td className="px-3 py-3 text-center text-gray-500">{job.attempt}</td>
              <td className="px-4 py-3 text-right text-gray-500 text-xs">{timeAgo(job.created_at)}</td>
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
