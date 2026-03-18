/** Attestation receipt and audit types for the OJS Admin UI. */

export interface Quote {
  type: string;
  evidence: string;
  nonce: string;
  issuedAt: string;
}

export interface Jurisdiction {
  region: string;
  datacenter: string;
  prover: string;
}

export interface ModelFingerprint {
  sha256: string;
  registryUrl: string;
}

export interface Signature {
  algorithm: string;
  value: string;
  keyId: string;
}

export interface AttestationReceipt {
  jobId: string;
  jobType: string;
  quote: Quote | null;
  jurisdiction: Jurisdiction | null;
  modelFingerprint: ModelFingerprint | null;
  signature: Signature;
  issuedAt: string;
  verified?: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  jobId: string;
  jobType: string;
  action: string;
  receipt: AttestationReceipt | null;
  actor: string;
  level: 'none' | 'pqc-only' | 'hardware';
}

export interface AuditFilter {
  jobType?: string;
  level?: string;
  jurisdiction?: string;
  dateFrom?: string;
  dateTo?: string;
}
