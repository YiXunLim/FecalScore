import { Link } from 'react-router-dom';
import type { Sample } from '../../api/client';
import { CameraIcon, CheckIcon } from '../../components/Icons';

type Props = {
  sample: Sample;
  onScoreNext: () => void;
};

/** Confirmation after a sample is saved. */
export default function SavedView({ sample, onScoreNext }: Props) {
  return (
    <div className="saved container">
      <span className="saved__icon" aria-hidden="true">
        <CheckIcon size={34} />
      </span>
      <h1 className="saved__title">Saved {sample.label}</h1>
      <dl className="saved__details">
        <div>
          <dt>Project</dt>
          <dd>{sample.project_name}</dd>
        </div>
        <div>
          <dt>Pig ID #</dt>
          <dd>{sample.pig_id}</dd>
        </div>
        <div>
          <dt>Trial day</dt>
          <dd>{sample.trial_day}</dd>
        </div>
        <div>
          <dt>Fecal score</dt>
          <dd>{sample.final_score}</dd>
        </div>
      </dl>

      <div className="saved__actions">
        <button type="button" className="btn btn-primary" onClick={onScoreNext}>
          <CameraIcon />
          Score next sample
        </button>
        <Link to="/saved" className="btn btn-outline">
          View saved samples
        </Link>
        <Link to="/" className="saved__home">
          Back to home
        </Link>
      </div>
    </div>
  );
}
