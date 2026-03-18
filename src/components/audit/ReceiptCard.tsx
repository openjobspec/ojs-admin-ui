import type { AttestationReceipt } from './types';

interface ReceiptCardProps {
  receipt: AttestationReceipt;
  onVerify?: (receipt: AttestationReceipt) => void;
}

export function ReceiptCard({ receipt, onVerify }: ReceiptCardProps) {
  const levelLabel = receipt.quote?.type === 'none'
    ? 'None'
    : receipt.quote?.type === 'pqc-only'
      ? 'PQC-Only'
      : receipt.quote?.type ?? 'Unknown';

  const levelColor = receipt.quote?.type === 'none'
    ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    : receipt.quote?.type === 'pqc-only'
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {receipt.jobId.slice(0, 8)}…
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-500">
            {receipt.jobType}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${levelColor}`}>
          {levelLabel}
        </span>
      </div>

      {/* Chain of custody visualization */}
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">Encode</span>
        <span>→</span>
        <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
          Sign ({receipt.signature.algorithm})
        </span>
        <span>→</span>
        <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
          Quote ({levelLabel})
        </span>
        {receipt.jurisdiction && (
          <>
            <span>→</span>
            <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded">
              {receipt.jurisdiction.region}
            </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">Key ID:</span>{' '}
          <span className="font-mono">{receipt.signature.keyId || '—'}</span>
        </div>
        <div>
          <span className="text-gray-400">Issued:</span>{' '}
          {new Date(receipt.issuedAt).toLocaleString()}
        </div>
        {receipt.modelFingerprint && (
          <div className="col-span-2">
            <span className="text-gray-400">Model:</span>{' '}
            <span className="font-mono">{receipt.modelFingerprint.sha256.slice(0, 16)}…</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        {receipt.verified !== undefined && (
          <span className={`text-xs font-medium ${receipt.verified ? 'text-green-600' : 'text-red-600'}`}>
            {receipt.verified ? '✓ Verified' : '✗ Failed'}
          </span>
        )}
        {onVerify && (
          <button
            onClick={() => onVerify(receipt)}
            className="text-xs px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Verify
          </button>
        )}
      </div>
    </div>
  );
}
