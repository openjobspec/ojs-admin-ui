import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReceiptCard } from './ReceiptCard';
import type { AttestationReceipt } from './types';

function makeReceipt(overrides: Partial<AttestationReceipt> = {}): AttestationReceipt {
  return {
    jobId: 'job-abcdef123456',
    jobType: 'email.send',
    quote: { type: 'pqc-only', evidence: 'e', nonce: 'n', issuedAt: '2026-01-01T00:00:00Z' },
    jurisdiction: null,
    modelFingerprint: null,
    signature: { algorithm: 'ml-dsa-65', value: 'sig', keyId: 'key-1' },
    issuedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('ReceiptCard', () => {
  it('renders the Verify button when onVerify is provided', () => {
    render(<ReceiptCard receipt={makeReceipt()} onVerify={vi.fn()} />);
    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  it('shows in-progress state and disables the button while verifying', () => {
    render(<ReceiptCard receipt={makeReceipt()} onVerify={vi.fn()} verifying />);
    const btn = screen.getByRole('button', { name: /verifying/i });
    expect(btn).toBeDisabled();
  });

  it('invokes onVerify with the receipt on click', () => {
    const onVerify = vi.fn();
    const receipt = makeReceipt();
    render(<ReceiptCard receipt={receipt} onVerify={onVerify} />);
    fireEvent.click(screen.getByRole('button', { name: /^verify$/i }));
    expect(onVerify).toHaveBeenCalledWith(receipt);
  });

  it('renders verification result when verified is set', () => {
    render(<ReceiptCard receipt={makeReceipt({ verified: true })} />);
    expect(screen.getByText(/verified/i)).toBeInTheDocument();
  });
});
