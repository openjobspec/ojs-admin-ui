import { useState } from 'react';

export function JsonViewer({ data }: { data: unknown }) {
  const [expanded, setExpanded] = useState(true);
  const json = JSON.stringify(data, null, 2);

  return (
    <div className="relative">
      <button
        className="absolute top-2 right-2 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        onClick={() => navigator.clipboard.writeText(json)}
      >
        Copy
      </button>
      <button
        className="absolute top-2 right-14 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? 'Collapse' : 'Expand'}
      </button>
      <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-3 text-xs overflow-auto max-h-96 font-mono">
        {expanded ? json : JSON.stringify(data)}
      </pre>
    </div>
  );
}
