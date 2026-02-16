import { useCallback } from 'react';
import { useClient } from '@/hooks/useAppContext';
import { usePolling } from '@/hooks/usePolling';
import { JsonViewer } from '@/components/common/JsonViewer';
import type { JobSchema } from '@/api/types';

export function SchemasPage() {
  const client = useClient();

  const fetchSchemas = useCallback(
    () => client.jobSchemas().then((r) => r.schemas).catch((err) => { console.warn('Failed to load job schemas:', err); return [] as JobSchema[]; }),
    [client],
  );
  const { data: schemas, refresh } = usePolling<JobSchema[]>(fetchSchemas, 30000);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Job Schemas & Versioning</h1>
        <button onClick={refresh} className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {(schemas ?? []).map((s) => (
          <div key={`${s.type}-${s.version}`} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-semibold">{s.type}</h3>
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                v{s.version}
              </span>
              {s.created_at && (
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Routing rules */}
            {s.routing && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Routing</h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Strategy: {s.routing.strategy}</div>
                <div className="space-y-1">
                  {s.routing.versions.map((v) => (
                    <div key={v.version} className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
                      <span className="font-mono">v{v.version}</span>
                      {v.weight != null && (
                        <span className="text-gray-500">weight: {v.weight}%</span>
                      )}
                      {v.queue && (
                        <span className="text-gray-500">→ {v.queue}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schema definition */}
            {s.schema && Object.keys(s.schema).length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Schema</h4>
                <JsonViewer data={s.schema} />
              </div>
            )}
          </div>
        ))}
      </div>

      {(schemas ?? []).length === 0 && (
        <p className="text-center py-8 text-gray-500 text-sm">No job schemas registered.</p>
      )}
    </div>
  );
}
