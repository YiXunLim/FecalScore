import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, createSample, listProjects, nextSampleNumber, type Project, type Sample } from '../../api/client';
import type { CapturedPhoto } from '../capture/capture';
import { useObjectUrl } from '../capture/useObjectUrl';
import ProjectPicker from '../projects/ProjectPicker';
import ScoreButtons from './ScoreButtons';
import { loadLastEntry, saveLastEntry } from './lastEntry';
import { BackIcon } from '../../components/Icons';

type Props = {
  photo: CapturedPhoto;
  /** The AI model's score (null until the model is connected in phase 7). */
  aiScore: number | null;
  onBack: () => void;
  onSaved: (sample: Sample) => void;
};

type Errors = Partial<Record<'project' | 'pen' | 'sampleNo' | 'pigId' | 'trialDay' | 'score', string>>;

const isWholeNumber = (v: string) => /^-?\d+$/.test(v.trim());

/** The sample details form shown after "Use photo". */
export default function SampleForm({ photo, aiScore, onBack, onSaved }: Props) {
  const last = loadLastEntry();
  const thumbUrl = useObjectUrl(photo.crop ?? photo.full);

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<number | null>(last.projectId);
  const [pen, setPen] = useState(last.pen);
  const [sampleNo, setSampleNo] = useState('');
  const [sampleNoTyped, setSampleNoTyped] = useState(false);
  const [pigId, setPigId] = useState('');
  const [trialDay, setTrialDay] = useState(last.trialDay);
  const [score, setScore] = useState<number | null>(aiScore);
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load the project list.
  useEffect(() => {
    listProjects()
      .then((list) => {
        setProjects(list);
        // Forget a remembered project that no longer exists.
        setProjectId((id) => (id !== null && list.some((p) => p.id === id) ? id : null));
      })
      .catch((e) => setProjectsError(e instanceof ApiError ? e.message : 'Could not load projects.'));
  }, []);

  // Suggest the next Sample # whenever project, pen or trial day change
  // (unless the user typed their own number).
  useEffect(() => {
    if (sampleNoTyped || projectId === null || !pen.trim() || !isWholeNumber(trialDay)) return;
    let cancelled = false;
    const t = setTimeout(() => {
      nextSampleNumber(projectId, pen.trim(), Number(trialDay))
        .then((n) => !cancelled && setSampleNo(String(n)))
        .catch(() => undefined);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [projectId, pen, trialDay, sampleNoTyped]);

  function validate(): Errors {
    const e: Errors = {};
    if (projectId === null) e.project = 'Choose a project.';
    if (!pen.trim()) e.pen = 'Enter the pen #.';
    if (!/^\d+$/.test(sampleNo.trim()) || Number(sampleNo) < 1) e.sampleNo = 'Enter a sample # (1 or more).';
    if (!pigId.trim()) e.pigId = 'Enter the pig ID #.';
    if (!isWholeNumber(trialDay)) e.trialDay = 'Enter the trial day as a number.';
    if (score === null) e.score = 'Pick a score.';
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const found = validate();
    setErrors(found);
    setSaveError(null);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      const saved = await createSample({
        project_id: projectId!,
        pen: pen.trim(),
        sample_no: Number(sampleNo),
        pig_id: pigId.trim(),
        trial_day: Number(trialDay),
        final_score: score!,
        ai_score: aiScore,
        description: description.trim(),
        captured_at: photo.capturedAt.toISOString(),
        image: photo.full,
        crop: photo.crop,
      });
      saveLastEntry({ projectId, pen: pen.trim(), trialDay: trialDay.trim() });
      onSaved(saved);
    } catch (e) {
      const message = e instanceof ApiError ? e.message : 'Could not save the sample.';
      if (e instanceof ApiError && e.status === 409) setErrors({ sampleNo: message });
      else setSaveError(message);
      setSaving(false);
    }
  }

  const labelPreview = pen.trim() && sampleNo.trim() ? `Pen ${pen.trim()} #${sampleNo.trim()}` : null;

  return (
    <div className="sample-page">
      <header className="sample-header">
        <button type="button" className="sample-header__back" onClick={onBack} aria-label="Back to photo">
          <BackIcon />
        </button>
        <h1>Sample details</h1>
      </header>

      <form className="sample-form container" onSubmit={handleSubmit} noValidate>
        <div className="sample-photo">
          {thumbUrl && <img src={thumbUrl} alt="Captured sample" />}
          <div className="sample-photo__text">
            <strong>Captured {photo.capturedAt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</strong>
            <span>Date and time are saved automatically</span>
          </div>
        </div>

        {projectsError && (
          <p className="form-alert" role="alert">
            {projectsError}
          </p>
        )}

        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={(id) => {
            setProjectId(id);
            setErrors((e) => ({ ...e, project: undefined }));
          }}
          onCreated={(p) => setProjects((list) => [p, ...list])}
          invalid={!!errors.project}
        />
        {errors.project && <p className="field__error">{errors.project}</p>}

        <div className="field-group">
          <div className="field-row">
            <label className="field">
              <span className="field__label">Pen #</span>
              <input
                className={`input${errors.pen ? ' is-invalid' : ''}`}
                inputMode="numeric"
                autoComplete="off"
                value={pen}
                onChange={(e) => setPen(e.target.value)}
              />
              {errors.pen && <span className="field__error">{errors.pen}</span>}
            </label>
            <label className="field">
              <span className="field__label">Sample #</span>
              <input
                className={`input${errors.sampleNo ? ' is-invalid' : ''}`}
                inputMode="numeric"
                autoComplete="off"
                value={sampleNo}
                onChange={(e) => {
                  setSampleNo(e.target.value);
                  setSampleNoTyped(e.target.value.trim() !== '');
                }}
              />
            </label>
          </div>
          {errors.sampleNo ? (
            <p className="field__error">{errors.sampleNo}</p>
          ) : (
            labelPreview && (
              <p className="field__hint">
                Saved as <strong>{labelPreview}</strong>
                {!sampleNoTyped && ' — the next number for this pen and day is filled in for you'}
              </p>
            )
          )}
        </div>

        <div className="field-row">
          <label className="field">
            <span className="field__label">Pig ID #</span>
            <input
              className={`input${errors.pigId ? ' is-invalid' : ''}`}
              inputMode="numeric"
              autoComplete="off"
              value={pigId}
              onChange={(e) => setPigId(e.target.value)}
            />
            {errors.pigId && <span className="field__error">{errors.pigId}</span>}
          </label>
          <label className="field">
            <span className="field__label">Trial day</span>
            <input
              className={`input${errors.trialDay ? ' is-invalid' : ''}`}
              inputMode="numeric"
              autoComplete="off"
              value={trialDay}
              onChange={(e) => setTrialDay(e.target.value)}
            />
            {errors.trialDay && <span className="field__error">{errors.trialDay}</span>}
          </label>
        </div>

        <ScoreButtons
          value={score}
          aiScore={aiScore}
          onChange={(n) => {
            setScore(n);
            setErrors((e) => ({ ...e, score: undefined }));
          }}
          invalid={!!errors.score}
        />
        {errors.score && <p className="field__error">{errors.score}</p>}

        <label className="field">
          <span className="field__label">
            Description <span className="field__optional">(optional)</span>
          </span>
          <textarea
            className="textarea"
            rows={3}
            placeholder="Notes about the sample or pen"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        {saveError && (
          <p className="form-alert" role="alert">
            {saveError}
          </p>
        )}

        <button type="submit" className="btn btn-primary sample-form__save" disabled={saving}>
          {saving ? 'Saving…' : 'Save sample'}
        </button>
      </form>
    </div>
  );
}
