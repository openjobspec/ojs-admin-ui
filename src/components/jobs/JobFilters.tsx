import type { JobState } from '@/api/types';
import { useState } from 'react';

const STATES: JobState[] = ['available', 'scheduled', 'pending', 'active', 'completed', 'retryable', 'cancelled', 'discarded'];

interface JobFiltersProps {
  filters: { queue?: string; state?: string; type?: string };
  queues: string[];
  onChange: (filters: { queue?: string; state?: string; type?: string }) => void;
}

export function JobFilters({ filters, queues, onChange }: JobFiltersProps) {
  const [typeInput, setTypeInput] = useState(filters.type ?? '');

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={filters.queue ?? ''}
        onChange={(e) => onChange({ ...filters, queue: e.target.value || undefined })}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800"
      >
        <option value="">All queues</option>
        {queues.map((q) => <option key={q} value={q}>{q}</option>)}
      </select>

      <select
        value={filters.state ?? ''}
        onChange={(e) => onChange({ ...filters, state: e.target.value || undefined })}
        className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800"
      >
        <option value="">All states</option>
        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>

      <form
        onSubmit={(e) => { e.preventDefault(); onChange({ ...filters, type: typeInput || undefined }); }}
        className="flex gap-1"
      >
        <input
          type="text"
          value={typeInput}
          onChange={(e) => setTypeInput(e.target.value)}
          placeholder="Job type…"
          className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800 w-48"
        />
        <button type="submit" className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">Filter</button>
      </form>

      {(filters.queue || filters.state || filters.type) && (
        <button
          onClick={() => { setTypeInput(''); onChange({}); }}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
