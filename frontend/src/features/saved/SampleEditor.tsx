import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ApiError, deleteSample, updateSample, type Project, type Sample } from '../../api/client';
import ScoreButtons from '../sample/ScoreButtons';
import { formatDateTime } from '../../lib/hooks';

type Props = {
  sample: Sample;
  projects: Project[];
  onClose: () => void;
  onSaved: (sample: Sample) => void;
  onDeleted: (sampleId: number) => void;
};

/** Pop-up to view a sample's photo and edit or delete it. */
export default function SampleEditor({ sample, projects, onClose, onSaved, onDeleted }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [projectId, setProjectId] = useState(sample.project_id);
  const [pen, setPen] = useState(sample.pen);
  const [sampleNo, setSampleNo] = useState(String(sample.sample_no));
  const [pigId, setPigId] = useState(sample.pig_id);
  const [trialDay, setTrialDay] = useState(String(sample.trial_day));
  const [score, setScore] = useState<number | null>(sample.final_score);
  const [description, setDescription] = useState(sample.description);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!pen.trim() || !pigId.trim() || !/^\d+$/.test(sampleNo.trim()) || !/^-?\d+$/.test(trialDay.trim())) {
      setError('Pen #, Sample #, Pig ID # and Trial day are required (numbers for Sample # and Trial day).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await updateSample(sample.id, {
        project_id: projectId,
        pen: pen.trim(),
        sample_no: Number(sampleNo),
        pig_id: pigId.trim(),
        trial_day: Number(trialDay),
        final_score: score ?? sample.final_score,
        description: description.trim(),
      });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the changes.');
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await deleteSample(sample.id);
      onDeleted(sample.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete the sample.');
      setBusy(false);
    }
  }

  const photoUrl = showCrop && sample.crop_url ? sample.crop_url : sample.image_url;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="sheet sheet--wide"
      aria-label={`Edit ${sample.label}`}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close();
      }}
    >
      <div className="editor">
        <div className="editor__photo">
          {photoUrl && <img src={photoUrl} alt={sample.label} />}
          {sample.crop_url && (
            <div className="editor__toggle" role="group" aria-label="Photo view">
              <button type="button" aria-pressed={!showCrop} onClick={() => setShowCrop(false)}>
                Full photo
              </button>
              <button type="button" aria-pressed={showCrop} onClick={() => setShowCrop(true)}>
                Template crop
              </button>
            </div>
          )}
        </div>

        <form className="editor__form" onSubmit={handleSave}>
          <div className="sheet__head">
            <h2>{sample.label}</h2>
            <button type="button" className="sheet__done" onClick={() => dialogRef.current?.close()}>
              Close
            </button>
          </div>
          <p className="editor__times">
            Captured {formatDateTime(sample.captured_at)}
            {sample.modified_at && <> · Modified {formatDateTime(sample.modified_at)}</>}
          </p>

          <label className="field">
            <span className="field__label">Project</span>
            <select className="input" value={projectId} onChange={(e) => setProjectId(Number(e.target.value))}>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <div className="field-row">
            <label className="field">
              <span className="field__label">Pen #</span>
              <input className="input" inputMode="numeric" value={pen} onChange={(e) => setPen(e.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">Sample #</span>
              <input className="input" inputMode="numeric" value={sampleNo} onChange={(e) => setSampleNo(e.target.value)} />
            </label>
          </div>
          <div className="field-row">
            <label className="field">
              <span className="field__label">Pig ID #</span>
              <input className="input" inputMode="numeric" value={pigId} onChange={(e) => setPigId(e.target.value)} />
            </label>
            <label className="field">
              <span className="field__label">Trial day</span>
              <input className="input" inputMode="numeric" value={trialDay} onChange={(e) => setTrialDay(e.target.value)} />
            </label>
          </div>

          <ScoreButtons value={score} aiScore={sample.ai_score} onChange={setScore} />

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

          <div className="editor__actions">
            {confirmDelete ? (
              <div className="editor__confirm">
                <span>Delete {sample.label} and its photos?</span>
                <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(false)} disabled={busy}>
                  Keep
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={busy}>
                  Delete
                </button>
              </div>
            ) : (
              <>
                <button type="button" className="editor__delete" onClick={() => setConfirmDelete(true)}>
                  Delete sample
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy}>
                  {busy ? 'Saving…' : 'Save changes'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </dialog>,
    document.body,
  );
}
