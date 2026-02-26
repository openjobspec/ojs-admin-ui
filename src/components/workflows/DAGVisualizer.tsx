import { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
  Position,
  Handle,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { WorkflowStep } from '@/api/types';

interface DAGVisualizerProps {
  steps: WorkflowStep[];
  workflowState: string;
}

// Custom node component for workflow steps
function StepNode({ data }: { data: StepNodeData }) {
  const stateColors: Record<string, string> = {
    completed: 'border-green-500 bg-green-50 dark:bg-green-950',
    active: 'border-amber-500 bg-amber-50 dark:bg-amber-950 animate-pulse',
    pending: 'border-gray-300 bg-gray-50 dark:bg-gray-900',
    failed: 'border-red-500 bg-red-50 dark:bg-red-950',
    cancelled: 'border-gray-400 bg-gray-100 dark:bg-gray-800',
  };

  const stateIcons: Record<string, string> = {
    completed: '✓',
    active: '⟳',
    pending: '○',
    failed: '✗',
    cancelled: '⊘',
  };

  const typeLabels: Record<string, string> = {
    chain: '⟶ Chain',
    group: '⟷ Group',
    batch: '▤ Batch',
  };

  const borderClass = stateColors[data.state] ?? stateColors.pending;

  return (
    <div className={`rounded-lg border-2 px-4 py-3 shadow-sm min-w-[160px] ${borderClass}`}>
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{stateIcons[data.state] ?? '○'}</span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
          {typeLabels[data.type] ?? data.type}
        </span>
      </div>
      <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate">
        {data.id.substring(0, 12)}
      </div>
      {data.jobCount > 0 && (
        <div className="text-[10px] text-gray-400 mt-1">
          {data.jobCount} job{data.jobCount !== 1 ? 's' : ''}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  );
}

interface StepNodeData {
  id: string;
  type: string;
  state: string;
  jobCount: number;
  label: string;
  [key: string]: unknown;
}

const nodeTypes: NodeTypes = {
  step: StepNode,
};

// Layered layout algorithm: assign layers based on dependency depth
function computeLayout(steps: WorkflowStep[]): { nodes: Node[]; edges: Edge[] } {
  const stepMap = new Map<string, WorkflowStep>();
  steps.forEach((s) => stepMap.set(s.id, s));

  // Compute layer depth for each node
  const depth = new Map<string, number>();
  const computeDepth = (id: string, visited: Set<string>): number => {
    if (depth.has(id)) return depth.get(id)!;
    if (visited.has(id)) return 0; // cycle guard
    visited.add(id);

    const step = stepMap.get(id);
    if (!step?.depends_on?.length) {
      depth.set(id, 0);
      return 0;
    }

    let maxParent = 0;
    for (const dep of step.depends_on) {
      maxParent = Math.max(maxParent, computeDepth(dep, visited) + 1);
    }
    depth.set(id, maxParent);
    return maxParent;
  };

  steps.forEach((s) => computeDepth(s.id, new Set()));

  // Group nodes by layer
  const layers = new Map<number, WorkflowStep[]>();
  steps.forEach((s) => {
    const d = depth.get(s.id) ?? 0;
    if (!layers.has(d)) layers.set(d, []);
    layers.get(d)!.push(s);
  });

  const LAYER_HEIGHT = 120;
  const NODE_WIDTH = 200;
  const NODE_GAP = 40;

  const nodes: Node[] = [];
  const sortedLayers = [...layers.entries()].sort((a, b) => a[0] - b[0]);

  for (const [layerIdx, layerSteps] of sortedLayers) {
    const totalWidth = layerSteps.length * NODE_WIDTH + (layerSteps.length - 1) * NODE_GAP;
    const startX = -totalWidth / 2;

    layerSteps.forEach((step, colIdx) => {
      nodes.push({
        id: step.id,
        type: 'step',
        position: {
          x: startX + colIdx * (NODE_WIDTH + NODE_GAP),
          y: layerIdx * LAYER_HEIGHT,
        },
        data: {
          id: step.id,
          type: step.type,
          state: step.state,
          jobCount: step.job_ids?.length ?? 0,
          label: step.id.substring(0, 12),
        },
      });
    });
  }

  // Create edges
  const edges: Edge[] = [];
  steps.forEach((step) => {
    if (step.depends_on) {
      step.depends_on.forEach((depId) => {
        const sourceState = stepMap.get(depId)?.state ?? 'pending';
        edges.push({
          id: `${depId}->${step.id}`,
          source: depId,
          target: step.id,
          animated: sourceState === 'active',
          style: {
            stroke: sourceState === 'completed' ? '#22c55e' : sourceState === 'failed' ? '#ef4444' : '#9ca3af',
            strokeWidth: 2,
          },
          markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
        });
      });
    }
  });

  return { nodes, edges };
}

export function DAGVisualizer({ steps, workflowState }: DAGVisualizerProps) {
  const { nodes, edges } = useMemo(() => computeLayout(steps), [steps]);

  const onInit = useCallback((instance: { fitView: () => void }) => {
    setTimeout(() => instance.fitView(), 100);
  }, []);

  if (steps.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        No steps to visualize
      </div>
    );
  }

  // Compute summary stats
  const completed = steps.filter((s) => s.state === 'completed').length;
  const failed = steps.filter((s) => s.state === 'failed').length;
  const active = steps.filter((s) => s.state === 'active').length;
  const pending = steps.filter((s) => s.state === 'pending').length;

  return (
    <div className="space-y-2">
      {/* Stats bar */}
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-green-500" /> {completed} completed
        </span>
        {active > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> {active} active
          </span>
        )}
        {pending > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300" /> {pending} pending
          </span>
        )}
        {failed > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" /> {failed} failed
          </span>
        )}
      </div>

      {/* DAG Graph */}
      <div className="h-[400px] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-950">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={onInit}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} color="#e5e7eb" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(node) => {
              const state = (node.data as StepNodeData).state;
              switch (state) {
                case 'completed': return '#22c55e';
                case 'active': return '#f59e0b';
                case 'failed': return '#ef4444';
                default: return '#9ca3af';
              }
            }}
          />
        </ReactFlow>
      </div>

      {/* Critical path indicator */}
      {workflowState === 'active' && (
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Workflow in progress — graph updates on refresh
        </div>
      )}
    </div>
  );
}
