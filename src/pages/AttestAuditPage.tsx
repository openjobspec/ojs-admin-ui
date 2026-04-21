import { useState, useCallback } from 'react';
import { AuditExplorer } from '@/components/audit';
import type { AuditEntry, AttestationReceipt } from '@/components/audit';

/**
 * Page component for the Attestation Audit Explorer.
 * Wraps AuditExplorer with data fetching and verification logic.
 *
 * NOTE: This page is part of OJS Labs (CTN — Conformance Trust Network).
 * Verification currently returns a placeholder result. Wire to the CTN
 * backend API once ojs-ctn reaches P2.
 */
export function AttestAuditPage() {
  const [entries] = useState<AuditEntry[]>([]);

  const handleVerify = useCallback(async (receipt: AttestationReceipt): Promise<boolean> => {
    // Labs placeholder: CTN verification API not yet available.
    // When ojs-ctn P2 ships, replace with:
    //   const resp = await client.verifyAttestation(receipt);
    //   return resp.verified;
    console.warn('[OJS Labs] Attestation verification is a placeholder — CTN backend not yet connected');
    void receipt;
    return false;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Attestation Audit</h1>
        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
          Labs
        </span>
      </div>
      <p className="text-sm text-gray-500">
        Verification requires the CTN backend (ojs-ctn P2). Results below are placeholders.
      </p>
      <AuditExplorer entries={entries} onVerify={handleVerify} />
    </div>
  );
}
