// Mirror dashboard types for the admin UI.

export interface MirrorQueue {
  name: string;
  connector: string; // sidekiq, bullmq, celery, sqs, cloudtasks, stepfunctions
  mode: 'observe' | 'shadow' | 'split';
  status: 'active' | 'paused' | 'error';
  throughput: number; // jobs/s
  mirrored: number; // total mirrored jobs
  divergence: number; // divergence count
  latencyMs: number; // average mirroring latency
  splitPercent?: number;
  autoRolledBack?: boolean;
  rollbackReason?: string;
  lastSeen: string; // ISO 8601
}

export interface MirrorReconcilerStatus {
  windowCount: number;
  matchCount: number;
  driftCount: number;
  driftRate: number;
  alertActive: boolean;
  alertMessage?: string;
  lastCheck: string;
}

export interface MirrorOverview {
  queues: MirrorQueue[];
  reconciler: MirrorReconcilerStatus;
  totalMirrored: number;
  totalDivergence: number;
}
