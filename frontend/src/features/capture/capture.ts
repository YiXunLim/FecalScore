import { CROP_PADDING } from './template';

export type CapturedPhoto = {
  /** Exactly what was visible on the screen, at full camera resolution. */
  full: Blob;
  /**
   * Only the template area (plus a small margin) — this is what the ML model will read.
   * null when the photo came from the phone's own camera app (no template on screen).
   */
  crop: Blob | null;
  capturedAt: Date;
};

/** Wraps a photo taken with the phone's own camera app (fallback when the live camera can't open). */
export function photoFromFile(file: File): CapturedPhoto {
  return { full: file, crop: null, capturedAt: new Date() };
}

/**
 * Takes a photo from the live <video>.
 *
 * The video fills the screen with "object-fit: cover", so parts of the camera
 * image can be cut off at the edges. We work out which part of the camera image
 * is visible, save that as the full photo, and cut out the template area for the crop.
 */
export async function capturePhoto(
  video: HTMLVideoElement,
  outline: SVGGraphicsElement,
): Promise<CapturedPhoto> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) throw new Error('Camera is not ready yet');

  const box = video.getBoundingClientRect();

  // How the camera image is scaled and shifted to cover the screen.
  const scale = Math.max(box.width / vw, box.height / vh);
  const offsetX = (box.width - vw * scale) / 2;
  const offsetY = (box.height - vh * scale) / 2;

  // Converts a point on the screen to a pixel in the camera image.
  const toVideo = (x: number, y: number) => ({
    x: (x - box.left - offsetX) / scale,
    y: (y - box.top - offsetY) / scale,
  });

  // 1) Full photo = the visible part of the camera image.
  const visTopLeft = toVideo(box.left, box.top);
  const visBottomRight = toVideo(box.right, box.bottom);
  const full = cropFromVideo(video, clampRect(visTopLeft, visBottomRight, vw, vh));

  // 2) Crop = the template's bounding box on screen, plus padding.
  const t = outline.getBoundingClientRect();
  const designToScreen = outline.getScreenCTM()?.a ?? 1; // how many screen px per design unit
  const pad = CROP_PADDING * designToScreen;
  const tTopLeft = toVideo(t.left - pad, t.top - pad);
  const tBottomRight = toVideo(t.right + pad, t.bottom + pad);
  const crop = cropFromVideo(video, clampRect(tTopLeft, tBottomRight, vw, vh));

  const [fullBlob, cropBlob] = await Promise.all([toJpeg(full), toJpeg(crop)]);
  return { full: fullBlob, crop: cropBlob, capturedAt: new Date() };
}

type Rect = { x: number; y: number; w: number; h: number };

function clampRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  maxW: number,
  maxH: number,
): Rect {
  const x = Math.max(0, Math.floor(a.x));
  const y = Math.max(0, Math.floor(a.y));
  const x2 = Math.min(maxW, Math.ceil(b.x));
  const y2 = Math.min(maxH, Math.ceil(b.y));
  return { x, y, w: Math.max(1, x2 - x), h: Math.max(1, y2 - y) };
}

function cropFromVideo(video: HTMLVideoElement, r: Rect): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = r.w;
  canvas.height = r.h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw the photo');
  ctx.drawImage(video, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
  return canvas;
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not save the photo'))),
      'image/jpeg',
      0.92,
    );
  });
}
