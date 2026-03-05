import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClient } from '@/hooks/useAppContext';
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder';

export function WorkflowBuilderPage() {
  const navigate = useNavigate();
  const client = useClient();
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeploy = async (json: object) => {
    setDeploying(true);
    setError(null);
    try {
      const workflow = await client.createWorkflow(json);
      navigate(`/workflows/${workflow.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to deploy workflow';
      setError(message);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workflows')}
            className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold">Workflow Builder</h1>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <WorkflowBuilder onDeploy={handleDeploy} deploying={deploying} />
    </div>
  );
}
