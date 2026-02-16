import { useNavigate } from 'react-router-dom';
import { WorkflowBuilder } from '@/components/workflows/WorkflowBuilder';

export function WorkflowBuilderPage() {
  const navigate = useNavigate();

  const handleDeploy = (json: object) => {
    console.log('Deploy workflow:', JSON.stringify(json, null, 2));
    alert('Workflow JSON logged to console (deploy endpoint not connected yet).');
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

      <WorkflowBuilder onDeploy={handleDeploy} />
    </div>
  );
}
