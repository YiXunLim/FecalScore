/**
 * Saves a file (photo, CSV, Excel, PDF) to the user's device WITHOUT leaving the app.
 *  - Phones: opens the share sheet (iPhone: "Save to Files" / "Save Image"; Android: save, Drive, email...).
 *  - Computers, or phones that can't share this file type: downloads it.
 *
 * Opening a file link directly would replace the app with the file, and an app opened
 * from a home-screen shortcut has no back button to return — so we never do that.
 */
export type SaveResult =
  | 'shared'
  | 'downloaded'
  | 'cancelled'
  /** iPhone only allows the share sheet right after a tap; ask the user to tap again (see shareFile). */
  | 'needs-tap';

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches;

const TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  csv: 'text/csv',
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

/** Wraps data as a named file with the right type, so the phone knows which apps can open it. */
export function makeFile(blob: Blob, filename: string): File {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const type = TYPES[ext] ?? (blob.type || 'application/octet-stream');
  return new File([blob], filename, { type });
}

/** Opens the share sheet for a file. Call it directly from a tap. */
export async function shareFile(file: File): Promise<SaveResult> {
  try {
    await navigator.share({ files: [file] });
    return 'shared';
  } catch (e) {
    const name = e instanceof DOMException ? e.name : '';
    if (name === 'AbortError') return 'cancelled';
    if (name === 'NotAllowedError') return 'needs-tap';
    throw e;
  }
}

export async function saveFileToDevice(blob: Blob, filename: string): Promise<SaveResult> {
  const file = makeFile(blob, filename);

  if (isTouchDevice() && navigator.canShare?.({ files: [file] })) {
    try {
      return await shareFile(file);
    } catch {
      // Sharing failed for another reason — fall back to a download below.
    }
  }

  downloadBlob(blob, filename);
  return 'downloaded';
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Reads the file name the server suggests (Content-Disposition), or uses the fallback. */
export function filenameFromResponse(res: Response, fallback: string): string {
  const header = res.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^";]+)"?/i.exec(header);
  return match ? match[1] : fallback;
}
