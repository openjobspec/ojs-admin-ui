import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';

export interface MountOptions {
  /** Base URL for the OJS backend (e.g., "http://localhost:8080"). Defaults to same-origin. */
  baseUrl?: string;
  /** URL basename for routing (e.g., "/ojs/admin"). Defaults to "/ojs/admin". */
  basename?: string;
}

/**
 * Mount the OJS Admin UI into a DOM element.
 *
 * Usage:
 *   import { mountOJSAdmin } from '@openjobspec/admin-ui';
 *   mountOJSAdmin(document.getElementById('ojs-admin'), { baseUrl: 'http://localhost:8080' });
 */
export function mountOJSAdmin(element: HTMLElement, options: MountOptions = {}): () => void {
  const root = createRoot(element);
  root.render(<App baseUrl={options.baseUrl ?? ''} basename={options.basename ?? '/ojs/admin'} />);
  return () => root.unmount();
}

export type { OJSManifest, AggregateStats, QueueSummary, JobSummary, JobDetail, WorkerSummary } from './api/types';
export { OJSAdminClient } from './api/client';
