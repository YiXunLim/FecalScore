import { saveFileToDevice, type SaveResult } from '../../lib/saveFile';

/**
 * Saves a photo to the user's device.
 *  - Phones: opens the share sheet (iPhone: "Save Image" puts it in Photos; Android: Gallery/Files).
 *  - Computers: downloads the file.
 */
export function savePhotoToDevice(blob: Blob, filename: string): Promise<SaveResult> {
  return saveFileToDevice(blob, filename);
}

/** e.g. fecalscore_2026-10-28_15-14-05.jpg */
export function photoFilename(date: Date, suffix = ''): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `_${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}`;
  return `fecalscore_${stamp}${suffix}.jpg`;
}
