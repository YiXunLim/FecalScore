import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { CAMERA_ERROR_TEXT, useCamera } from './useCamera';
import { capturePhoto, photoFromFile, type CapturedPhoto } from './capture';
import { DESIGN_HEIGHT, DESIGN_WIDTH, TEMPLATE_PATH, TIP_CENTER } from './template';
import { BackIcon } from '../../components/Icons';

type Props = {
  onCapture: (photo: CapturedPhoto) => void;
  onBack: () => void;
};

/** Full-screen live camera with the sample template drawn on top. */
export default function CameraView({ onCapture, onBack }: Props) {
  const { videoRef, status, error, start } = useCamera();
  const outlineRef = useRef<SVGPathElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    start();
  }, [start]);

  async function handleCapture() {
    const video = videoRef.current;
    const outline = outlineRef.current;
    if (!video || !outline || busy) return;
    setBusy(true);
    setCaptureError(null);
    try {
      onCapture(await capturePhoto(video, outline));
    } catch (e) {
      setCaptureError(e instanceof Error ? e.message : 'Could not take the photo');
      setBusy(false);
    }
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(photoFromFile(file));
  }

  return (
    <div className="cam">
      <video ref={videoRef} className="cam__video" playsInline muted autoPlay aria-label="Live camera view" />

      {/* Template: darkens everything except the sample-shaped window */}
      <svg
        className="cam__overlay"
        viewBox={`0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <mask id="template-window">
            <rect x={-5000} y={-5000} width={10000} height={10000} fill="white" />
            <path d={TEMPLATE_PATH} fill="black" />
          </mask>
        </defs>
        <rect x={-5000} y={-5000} width={10000} height={10000} fill="rgba(0,0,0,0.6)" mask="url(#template-window)" />
        <path ref={outlineRef} d={TEMPLATE_PATH} className="cam__outline" />
        <path
          d={`M${TIP_CENTER.x} ${TIP_CENTER.y - 10} V${TIP_CENTER.y + 10} M${TIP_CENTER.x - 10} ${TIP_CENTER.y} H${TIP_CENTER.x + 10}`}
          className="cam__crosshair"
        />
      </svg>

      <div className="cam__top">
        <p className="cam__hint">Place the sample inside the outline — oval tip at the top, stick pointing down</p>
      </div>

      {status === 'starting' && <p className="cam__status">Opening camera…</p>}

      {status === 'error' && error && (
        <div className="cam__error" role="alert">
          <p>{CAMERA_ERROR_TEXT[error]}</p>
          <div className="cam__error-actions">
            {error !== 'insecure' && (
              <button type="button" className="btn btn-primary" onClick={start}>
                Try again
              </button>
            )}
            <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
              Use phone camera app instead
            </button>
          </div>
          <p className="cam__error-note">The camera app won’t show the template, so line the sample up carefully.</p>
        </div>
      )}

      {captureError && (
        <p className="cam__status" role="alert">
          {captureError}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        hidden
      />

      <div className="cam__bar">
        <button type="button" className="cam__round cam__round--back" onClick={onBack} aria-label="Go back">
          <BackIcon size={28} />
        </button>
        <span className="cam__bar-text">{status === 'ready' ? 'Hold steady' : ''}</span>
        <button
          type="button"
          className="cam__shutter"
          onClick={handleCapture}
          disabled={status !== 'ready' || busy}
          aria-label="Capture photo"
        >
          <span className="cam__shutter-inner" />
        </button>
      </div>
    </div>
  );
}
