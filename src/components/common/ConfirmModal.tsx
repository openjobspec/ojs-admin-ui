import { useEffect, useId, useRef, useState } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmingLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  destructive?: boolean;
  children?: React.ReactNode;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmingLabel = 'Confirming…',
  onConfirm,
  onCancel,
  destructive,
  children,
}: ConfirmModalProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const titleId = useId();
  const messageId = useId();
  const dialogRef = useFocusTrap<HTMLDivElement>(open, {
    onEscape: onCancel,
    escapeDisabled: pending,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      if (mountedRef.current) {
        const detail = e instanceof Error ? e.message : String(e);
        setError(detail ? `The action failed: ${detail}.` : 'The action failed.');
      }
    } finally {
      if (mountedRef.current) setPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overscroll-contain"
      onClick={() => { if (!pending) onCancel(); }}
      role="presentation"
      style={{ touchAction: 'manipulation' }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        aria-busy={pending}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="text-lg font-semibold mb-2">{title}</h3>
        <p id={messageId} className="text-sm text-gray-600 dark:text-gray-400 mb-6">{message}</p>
        {error && (
          <p role="alert" aria-live="assertive" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error} Please try again.
          </p>
        )}
        <fieldset disabled={pending} className="contents">
          {children}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => { if (!pending) onCancel(); }}
              disabled={pending}
              className="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={pending}
              className={`px-4 py-2 text-sm rounded text-white ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {pending ? confirmingLabel : confirmLabel}
            </button>
          </div>
        </fieldset>
      </div>
    </div>
  );
}
