import { useState, useCallback } from 'react';
import { AuditExplorer } from '@/components/audit';
import type { AuditEntry, AttestationReceipt } from '@/components/audit';

/**
 * Page component for the Attestation Audit Explorer.
 * Wraps AuditExplorer with data fetching and verification logic.
 */
export function AttestAuditPage() {
  const [entries] = useState<AuditEntry[]>([]);

  const handleVerify = useCallback(async (receipt: AttestationReceipt): Promise<boolean> => {
    // TODO: call backend verification endpoint
    // e.g. const resp = await client.verifyAttestation(receipt);
    // return resp.verified;
    void receipt;
    return true;
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Attestation Audit</h1>
      </div>
      <AuditExplorer entries={entries} onVerify={handleVerify} />
    </div>
  );
}
