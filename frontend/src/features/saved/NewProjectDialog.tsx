import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ApiError, createProject, type Project } from '../../api/client';

type Props = {
  onClose: () => void;
  onCreated: (project: Project) => void;
};

/** Small pop-up for creating a project from the Saved samples page. */
export default function NewProjectDialog({ onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a project name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onCreated(await createProject(name.trim(), description.trim()));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the project.');
      setBusy(false);
    }
  }

  return createPortal(
    <dialog ref={dialogRef} className="sheet" aria-label="New project" onClose={onClose}>
      <form className="sheet__body" onSubmit={handleSubmit}>
        <div className="sheet__head">
          <h2>New project</h2>
          <button type="button" className="sheet__done" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
        </div>
        <label className="field">
          <span className="field__label">Project name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <label className="field">
          <span className="field__label">
            Description <span className="field__optional">(optional)</span>
          </span>
          <textarea className="textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Creating…' : 'Create project'}
        </button>
      </form>
    </dialog>,
    document.body,
  );
}
