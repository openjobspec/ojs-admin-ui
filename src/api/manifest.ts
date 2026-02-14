import type { OJSManifest } from './types';

export function hasCapability(manifest: OJSManifest, cap: string): boolean {
  return manifest.capabilities?.[cap] === true;
}

export function hasExtension(manifest: OJSManifest, name: string): boolean {
  const ext = manifest.extensions;
  if (!ext) return false;
  if (Array.isArray(ext)) return ext.includes(name);
  const all = [...(ext.official ?? []), ...(ext.experimental ?? [])];
  return all.some((e) => e.name === name);
}

export function supportsAdminApi(manifest: OJSManifest): boolean {
  return hasExtension(manifest, 'admin-api');
}

export function conformanceBadge(level: number): string {
  const names = ['Core', 'Reliable', 'Scheduled', 'Orchestration', 'Advanced'];
  return `Level ${level}: ${names[level] ?? 'Unknown'}`;
}
