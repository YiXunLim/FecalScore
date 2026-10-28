import { useEffect, useState } from 'react';
import type { CapturedPhoto } from './capture';
import { useObjectUrl } from './useObjectUrl';
import { photoFilename, savePhotoToDevice } from './savePhoto';
import { CheckIcon, DownloadIcon, RetakeIcon } from '../../components/Icons';

type Props = {
  photo: CapturedPhoto;
  onRetake: () => void;
  onUse: () => void;
};

/** Shows the captured photo with the score badge, Retake / Use photo, and save-to-phone. */
export default function ReviewView({ photo, onRetake, onUse }: Props) {
  const url = useObjectUrl(photo.full);

  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleSave() {
    const result = await savePhotoToDevice(photo.full, photoFilename(photo.capturedAt));
    if (result === 'downloaded') setToast('Photo downloaded');
    if (result === 'shared') setToast('Photo shared');
  }

  return (
    <div className="review">
      {url && <img src={url} alt="Captured sample" className="review__photo" />}

      {/* Score badge — the ML model fills this in from phase 7 */}
      <div className="score-chip">
        <span className="score-chip__value" aria-hidden="true">
          –
        </span>
        <span className="score-chip__text">
          <span className="score-chip__label">AI score</span>
          <span className="score-chip__main">Model not connected yet</span>
        </span>
      </div>

      <button type="button" className="cam__round review__save" onClick={handleSave} aria-label="Save photo to phone">
        <DownloadIcon size={24} />
      </button>

      {toast && (
        <p className="review__toast" role="status">
          {toast}
        </p>
      )}

      <div className="review__bar">
        <p className="review__question">Is the sample sharp and inside the outline?</p>
        <div className="review__actions">
          <button type="button" className="review__btn review__btn--retake" onClick={onRetake}>
            <RetakeIcon />
            Retake
          </button>
          <button type="button" className="review__btn review__btn--use" onClick={onUse}>
            <CheckIcon />
            Use photo
          </button>
        </div>
      </div>
    </div>
  );
}
