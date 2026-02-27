import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
  type OnConnect,
  type NodeTypes,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WorkflowCodeGen } from './WorkflowCodeGen';

/* ---------- types ---------- */
type WorkflowType = 'chain' | 'group' | 'batch';

interface StepData {
  label: string;
  jobType: string;
  args: string;
  editable: boolean;
  variant?: 'start' | 'end' | 'callback' | 'step';
  [key: string]: unknown;
}

type StepNode = Node<StepData>;

/* ---------- custom node ---------- */
function StepNodeComponent({ data }: { data: StepData }) {
  const bg =
    data.variant === 'start' || data.variant === 'end'
      ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
      : data.variant === 'callback'
        ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700'
        : 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700';

  return (
    <div className={`rounded-lg border-2 px-4 py-3 shadow-sm min-w-[140px] text-center ${bg}`}>
      <Handle type="target" position={Position.Left} className="!bg-gray-400" />
      <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">{data.label}</div>
      {data.jobType && (
        <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-mono">{data.jobType}</div>
      )}
      <Handle type="source" position={Position.Right} className="!bg-gray-400" />
    </div>
  );
}

const nodeTypes: NodeTypes = { step: StepNodeComponent };

/* ---------- helpers ---------- */
let idCounter = 0;
const nextId = () => `step-${++idCounter}`;

function buildLayout(
  steps: { id: string; jobType: string; args: string }[],
  workflowType: WorkflowType,
): { nodes: StepNode[]; edges: Edge[] } {
  const nodes: StepNode[] = [];
  const edges: Edge[] = [];

  if (steps.length === 0) return { nodes, edges };

  if (workflowType === 'chain') {
    steps.forEach((s, i) => {
      nodes.push({
        id: s.id,
        type: 'step',
        position: { x: i * 220, y: 100 },
        data: { label: `Step ${i + 1}`, jobType: s.jobType, args: s.args, editable: true, variant: 'step' },
      });
      if (i > 0) {
        const prev = steps[i - 1];
        if (prev) edges.push({ id: `e-${prev.id}-${s.id}`, source: prev.id, target: s.id, animated: true });
      }
    });
  } else {
    // group / batch — fan-out / fan-in
    const startId = '__start__';
    const endId = '__end__';
    nodes.push({
      id: startId,
      type: 'step',
      position: { x: 0, y: 100 + ((steps.length - 1) * 80) / 2 },
      data: { label: 'Start', jobType: '', args: '', editable: false, variant: 'start' },
    });

    steps.forEach((s, i) => {
      nodes.push({
        id: s.id,
        type: 'step',
        position: { x: 240, y: i * 80 + 40 },
        data: { label: `Step ${i + 1}`, jobType: s.jobType, args: s.args, editable: true, variant: 'step' },
      });
      edges.push({ id: `e-start-${s.id}`, source: startId, target: s.id, animated: true });
    });

    const endY = 100 + ((steps.length - 1) * 80) / 2;
    nodes.push({
      id: endId,
      type: 'step',
      position: { x: 480, y: endY },
      data: { label: workflowType === 'batch' ? 'Fan-in' : 'End', jobType: '', args: '', editable: false, variant: 'end' },
    });
    steps.forEach((s) => {
      edges.push({ id: `e-${s.id}-end`, source: s.id, target: endId, animated: true });
    });

    if (workflowType === 'batch') {
      const cbId = '__callback__';
      nodes.push({
        id: cbId,
        type: 'step',
        position: { x: 720, y: endY },
        data: { label: 'on_complete', jobType: '', args: '', editable: false, variant: 'callback' },
      });
      edges.push({ id: 'e-end-cb', source: endId, target: cbId, animated: true });
    }
  }

  return { nodes, edges };
}

interface OJSStep {
  type: string;
  args: unknown[];
}

function generateOJS(
  steps: { id: string; jobType: string; args: string }[],
  workflowType: WorkflowType,
): object {
  const ojsSteps: OJSStep[] = steps.map((s) => {
    let parsedArgs: unknown[] = [];
    try {
      const parsed: unknown = JSON.parse(s.args || '[]');
      parsedArgs = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      parsedArgs = [];
    }
    return { type: s.jobType || 'unnamed', args: parsedArgs };
  });

  if (workflowType === 'chain') {
    return { type: 'chain', steps: ojsSteps };
  }
  if (workflowType === 'group') {
    return { type: 'group', tasks: ojsSteps };
  }
  // batch
  return { type: 'batch', tasks: ojsSteps, on_complete: { type: 'callback', args: [] } };
}

/* ---------- main component ---------- */
export function WorkflowBuilder({ onDeploy }: { onDeploy?: (json: object) => void }) {
  const [workflowType, setWorkflowType] = useState<WorkflowType>('chain');
  const [steps, setSteps] = useState<{ id: string; jobType: string; args: string }[]>([]);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  const layout = useMemo(() => buildLayout(steps, workflowType), [steps, workflowType]);
  const [nodes, setNodes, onNodesChange] = useNodesState(layout.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layout.edges);

  // Sync layout when steps/type change
  const prevLayout = useMemo(() => JSON.stringify(layout), [layout]);
  useMemo(() => {
    setNodes(layout.nodes);
    setEdges(layout.edges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevLayout]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const addStep = () => {
    const id = nextId();
    setSteps((prev) => [...prev, { id, jobType: '', args: '[]' }]);
    setEditingStep(id);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (editingStep === id) setEditingStep(null);
  };

  const updateStep = (id: string, field: 'jobType' | 'args', value: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const ojsJson = useMemo(() => generateOJS(steps, workflowType), [steps, workflowType]);

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 space-y-4 overflow-auto">
        {/* Workflow type */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Workflow Type</label>
          <select
            value={workflowType}
            onChange={(e) => setWorkflowType(e.target.value as WorkflowType)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 bg-white dark:bg-gray-800"
          >
            <option value="chain">⟶ Chain (sequential)</option>
            <option value="group">⟷ Group (parallel)</option>
            <option value="batch">▤ Batch (parallel + callback)</option>
          </select>
        </div>

        {/* Add step */}
        <button
          onClick={addStep}
          className="w-full text-sm px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add Step
        </button>

        {/* Step list */}
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={`bg-white dark:bg-gray-900 rounded-lg border p-3 text-sm cursor-pointer transition ${
                editingStep === step.id
                  ? 'border-blue-400 dark:border-blue-600 ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
              onClick={() => setEditingStep(editingStep === step.id ? null : step.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700 dark:text-gray-200">Step {i + 1}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeStep(step.id); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              {step.jobType && (
                <span className="text-xs text-gray-500 font-mono">{step.jobType}</span>
              )}

              {editingStep === step.id && (
                <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Job Type</label>
                    <input
                      type="text"
                      value={step.jobType}
                      onChange={(e) => updateStep(step.id, 'jobType', e.target.value)}
                      placeholder="e.g. send_email"
                      className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Args (JSON)</label>
                    <textarea
                      value={step.args}
                      onChange={(e) => updateStep(step.id, 'args', e.target.value)}
                      rows={3}
                      className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Deploy button */}
        {onDeploy && steps.length > 0 && (
          <button
            onClick={() => onDeploy(ojsJson)}
            className="w-full text-sm px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Deploy Workflow
          </button>
        )}
      </div>

      {/* Canvas + JSON preview */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* React Flow canvas */}
        <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {steps.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Add steps to build your workflow visually
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              proOptions={{ hideAttribution: true }}
              className="bg-gray-50 dark:bg-gray-950"
            >
              <Controls className="!bg-white dark:!bg-gray-800 !border-gray-200 dark:!border-gray-700 !shadow-sm" />
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            </ReactFlow>
          )}
        </div>

        {/* JSON preview */}
        <div className="h-48 flex-shrink-0 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
            <span className="text-xs font-semibold text-gray-500 uppercase">OJS Workflow JSON</span>
            <button
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(ojsJson, null, 2))}
            >
              Copy
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto h-[calc(100%-2.5rem)]">
            {JSON.stringify(ojsJson, null, 2)}
          </pre>
        </div>

        {/* SDK Code Generation */}
        <WorkflowCodeGen
          steps={steps.map(s => ({ jobType: s.jobType, args: s.args }))}
          workflowType={workflowType}
        />
      </div>
    </div>
  );
}

