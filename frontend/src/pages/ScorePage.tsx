import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraView from '../features/capture/CameraView';
import ReviewView from '../features/capture/ReviewView';
import SampleForm from '../features/sample/SampleForm';
import SavedView from '../features/sample/SavedView';
import type { CapturedPhoto } from '../features/capture/capture';
import type { Sample } from '../api/client';
import '../features/capture/capture.css';
import '../features/sample/sample.css';

type Step = 'camera' | 'review' | 'form' | 'saved';

/**
 * The scoring flow:
 *   camera -> take a photo with the template
 *   review -> Retake (back to camera) or Use photo
 *   form   -> project, pen #, sample #, pig ID #, trial day, score, description
 *   saved  -> confirmation, then score the next sample
 */
export default function ScorePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('camera');
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [saved, setSaved] = useState<Sample | null>(null);

  // The AI model is connected in phase 7; until then there is no AI score.
  const aiScore: number | null = null;

  function startOver() {
    setPhoto(null);
    setSaved(null);
    setStep('camera');
  }

  if (step === 'review' && photo) {
    return <ReviewView photo={photo} onRetake={startOver} onUse={() => setStep('form')} />;
  }

  if (step === 'form' && photo) {
    return (
      <SampleForm
        photo={photo}
        aiScore={aiScore}
        onBack={() => setStep('review')}
        onSaved={(s) => {
          setSaved(s);
          setStep('saved');
        }}
      />
    );
  }

  if (step === 'saved' && saved) {
    return <SavedView sample={saved} onScoreNext={startOver} />;
  }

  return (
    <CameraView
      onBack={() => navigate('/')}
      onCapture={(p) => {
        setPhoto(p);
        setStep('review');
      }}
    />
  );
}
