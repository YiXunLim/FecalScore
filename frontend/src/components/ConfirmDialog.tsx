import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import '../features/projects/ProjectPicker.css'; // shared pop-up ("sheet") styles
import './ConfirmDialog.css';

type Props = {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  /** Runs the delete. Throw an Error with a message to show it in the box. */
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

/** "Are you sure?" box — the second confirmation before anything is deleted. */
export default function ConfirmDialog({ title, children, confirmLabel, onConfirm, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      dialogRef.current?.close();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return createPortal(
    <dialog ref={dialogRef} className="sheet confirm" aria-label={title} onClose={onClose}>
      <div className="sheet__body">
        <h2 className="confirm__title">{title}</h2>
        <div className="confirm__text">{children}</div>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        <div className="confirm__actions">
          {/* "Cancel" is first and focused, so a stray tap or Enter never deletes. */}
          <button type="button" className="btn btn-outline" onClick={() => dialogRef.current?.close()} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleConfirm} disabled={busy}>
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>,
    document.body,
  );
}
