import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus = 'starting' | 'ready' | 'error';

export type CameraError =
  | 'insecure' // page is not HTTPS
  | 'unsupported' // browser has no camera API
  | 'denied' // user blocked camera permission
  | 'not-found' // no camera on this device
  | 'in-use' // another app is using the camera
  | 'unknown';

/**
 * Opens the phone's back camera and shows it in the given <video> element.
 * Call start() to (re)open the camera and stop() to release it.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Counts start/stop calls so a slow, outdated camera request can be thrown away.
  const requestRef = useRef(0);
  const [status, setStatus] = useState<CameraStatus>('starting');
  const [error, setError] = useState<CameraError | null>(null);

  const stop = useCallback(() => {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    const request = requestRef.current;
    setStatus('starting');
    setError(null);

    if (!window.isSecureContext) {
      setStatus('error');
      setError('insecure');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setError('unsupported');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' }, // back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      if (request !== requestRef.current) {
        // The camera was stopped or restarted while we waited — release this one.
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => undefined);
      }
      setStatus('ready');
    } catch (e) {
      if (request !== requestRef.current) return;
      const name = (e as { name?: string } | null)?.name ?? '';
      const errorByName: Record<string, CameraError> = {
        NotAllowedError: 'denied',
        SecurityError: 'denied',
        NotFoundError: 'not-found',
        OverconstrainedError: 'not-found',
        NotReadableError: 'in-use',
        NotSupportedError: 'unsupported',
      };
      setStatus('error');
      setError(errorByName[name] ?? 'unknown');
    }
  }, [stop]);

  // Always release the camera when leaving the page.
  useEffect(() => stop, [stop]);

  return { videoRef, status, error, start, stop };
}

export const CAMERA_ERROR_TEXT: Record<CameraError, string> = {
  insecure:
    'The camera only works on a secure (https://) address. On your phone, use the address from "npm run dev:phone".',
  unsupported: 'This browser cannot open the camera. Try Safari on iPhone or Chrome on Android.',
  denied:
    'Camera permission was blocked. Allow camera access for this site in your browser settings, then try again.',
  'not-found': 'No camera was found on this device.',
  'in-use': 'The camera is being used by another app. Close it and try again.',
  unknown: 'The camera could not be opened. Try again.',
};
