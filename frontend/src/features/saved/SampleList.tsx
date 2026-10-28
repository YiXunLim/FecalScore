import { useState } from 'react';
import { ApiError, deleteSample, type Sample } from '../../api/client';
import { EditIcon, TrashIcon } from '../../components/Icons';
import SwipeRow from '../../components/SwipeRow';
import ConfirmDialog from '../../components/ConfirmDialog';
import { formatDateTime, useMediaQuery } from '../../lib/hooks';

type Props = {
  samples: Sample[];
  showProject?: boolean;
  onOpen: (sample: Sample) => void;
  /** Called after a sample was deleted (to reload the list). */
  onDeleted: (sampleId: number) => void;
};

/**
 * Samples as a table on wide screens and as cards on phones.
 * Delete: swipe a card left (phones) or press the trash button (PC), then confirm.
 */
export default function SampleList({ samples, showProject = false, onOpen, onDeleted }: Props) {
  const wide = useMediaQuery('(min-width: 900px)');
  const [toDelete, setToDelete] = useState<Sample | null>(null);

  const confirm = toDelete && (
    <ConfirmDialog
      title={`Delete ${toDelete.label}?`}
      confirmLabel="Delete sample"
      onClose={() => setToDelete(null)}
      onConfirm={async () => {
        try {
          await deleteSample(toDelete.id);
        } catch (e) {
          throw new Error(e instanceof ApiError ? e.message : 'Could not delete the sample.');
        }
        onDeleted(toDelete.id);
      }}
    >
      <p>
        <strong>{toDelete.label}</strong> · Pig {toDelete.pig_id} · Day {toDelete.trial_day}
        {showProject && <> · {toDelete.project_name}</>}
      </p>
      <p>The sample and its photos will be permanently deleted. This can’t be undone.</p>
    </ConfirmDialog>
  );

  if (wide) {
    return (
      <>
        <div className="table-wrap">
          <table className="sample-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Sample</th>
                {showProject && <th>Project</th>}
                <th>Pig ID #</th>
                <th>Trial day</th>
                <th>AI score</th>
                <th>Final score</th>
                <th>Description</th>
                <th>Captured</th>
                <th>Modified</th>
                <th>
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s) => (
                <tr key={s.id} onClick={() => onOpen(s)}>
                  <td>{s.thumb_url && <img className="thumb" src={s.thumb_url} alt="" loading="lazy" />}</td>
                  <td className="sample-table__label">{s.label}</td>
                  {showProject && <td>{s.project_name}</td>}
                  <td>{s.pig_id}</td>
                  <td>{s.trial_day}</td>
                  <td className="muted">{s.ai_score ?? '—'}</td>
                  <td>
                    <span className="score-cell">
                      <span className="score-badge score-badge--sm">{s.final_score}</span>
                      {s.edited && <span className="tag">Edited</span>}
                    </span>
                  </td>
                  <td className="muted sample-table__desc">{s.description}</td>
                  <td className="muted nowrap">{formatDateTime(s.captured_at)}</td>
                  <td className="muted nowrap">{s.modified_at ? formatDateTime(s.modified_at) : '—'}</td>
                  <td>
                    <span className="row-actions">
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={`Edit ${s.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(s);
                        }}
                      >
                        <EditIcon size={18} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        aria-label={`Delete ${s.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setToDelete(s);
                        }}
                      >
                        <TrashIcon size={18} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {confirm}
      </>
    );
  }

  return (
    <>
      <p className="swipe-hint">Tip: swipe a sample left to delete it.</p>
      <ul className="sample-cards">
        {samples.map((s) => (
          <li key={s.id}>
            <SwipeRow onDelete={() => setToDelete(s)} deleteLabel={s.label}>
              <button type="button" className="sample-card" onClick={() => onOpen(s)}>
                {s.thumb_url ? (
                  <img className="thumb thumb--lg" src={s.thumb_url} alt="" loading="lazy" draggable={false} />
                ) : (
                  <span className="thumb thumb--lg" />
                )}
                <span className="sample-card__text">
                  <span className="sample-card__label">{s.label}</span>
                  <span className="sample-card__meta">
                    Day {s.trial_day} · Pig {s.pig_id}
                  </span>
                  {showProject && <span className="sample-card__project">{s.project_name}</span>}
                  <span className="sample-card__time">{formatDateTime(s.captured_at)}</span>
                  {s.edited && <span className="tag">Edited · AI said {s.ai_score}</span>}
                </span>
                <span className="score-badge score-badge--sm">{s.final_score}</span>
              </button>
            </SwipeRow>
          </li>
        ))}
      </ul>
      {confirm}
    </>
  );
}
