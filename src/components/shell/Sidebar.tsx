import { NavLink } from 'react-router-dom';
import { useManifest } from '@/hooks/useAppContext';
import { hasCapability, hasExtension } from '@/api/manifest';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '▣' },
  { to: '/queues', label: 'Queues', icon: '☰' },
  { to: '/jobs', label: 'Jobs', icon: '⚡' },
  { to: '/scheduled', label: 'Scheduled', icon: '◷' },
  { to: '/workers', label: 'Workers', icon: '⚙' },
  { to: '/pools', label: 'Worker Pools', icon: '⊞', capability: 'fair_scheduling' },
  { to: '/crons', label: 'Cron Jobs', icon: '⏱', capability: 'cron' },
  { to: '/workflows', label: 'Workflows', icon: '⤳', capability: 'workflows' },
  { to: '/rate-limits', label: 'Rate Limits', icon: '⊘', capability: 'rate_limiting' },
  { to: '/unique-jobs', label: 'Unique Jobs', icon: '⊡', capability: 'unique_jobs' },
  { to: '/webhooks', label: 'Webhooks', icon: '⇶', capability: 'webhooks' },
  { to: '/events', label: 'Events', icon: '↯', capability: 'events' },
  { to: '/dead-letter', label: 'Dead Letter', icon: '☠', capability: 'dead_letter' },
  { to: '/tenants', label: 'Tenants', icon: '⊟', capability: 'multi_tenancy' },
  { to: '/schemas', label: 'Schemas', icon: '⊠', capability: 'job_versioning' },
  { to: '/audit-log', label: 'Audit Log', icon: '📋' },
  { to: '/settings', label: 'Settings', icon: '⚑' },
];

export function Sidebar() {
  const manifest = useManifest();

  return (
    <aside className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">OJS Admin</h1>
        {manifest && (
          <p className="text-xs text-gray-500 mt-0.5">
            {manifest.implementation.name} v{manifest.implementation.version}
          </p>
        )}
      </div>
      <nav className="flex-1 py-2" aria-label="Primary">
        {navItems.map((item) => {
          if (item.capability && manifest && !hasCapability(manifest, item.capability) && !hasExtension(manifest, item.capability)) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 text-sm ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium border-r-2 border-blue-600'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`
              }
              end={item.to === '/'}
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      {manifest && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500">
          <div>Backend: {manifest.backend}</div>
          <div>Level {manifest.conformance_level}</div>
        </div>
      )}
    </aside>
  );
}
