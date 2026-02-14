import { createContext, useContext } from 'react';
import type { OJSManifest } from '@/api/types';
import { OJSAdminClient } from '@/api/client';

interface AppContextValue {
  client: OJSAdminClient;
  manifest: OJSManifest | null;
  baseUrl: string;
  connected: boolean;
}

export const AppContext = createContext<AppContextValue>({
  client: new OJSAdminClient(),
  manifest: null,
  baseUrl: '',
  connected: false,
});

export function useAppContext() {
  return useContext(AppContext);
}

export function useClient() {
  return useContext(AppContext).client;
}

export function useManifest() {
  return useContext(AppContext).manifest;
}

export function useConnected() {
  return useContext(AppContext).connected;
}
