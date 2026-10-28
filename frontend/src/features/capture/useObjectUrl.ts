import { useEffect, useState } from 'react';

/**
 * Turns a photo (Blob) into a temporary address an <img> can show,
 * and frees it again when the photo changes or the screen closes.
 */
export function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);

  return url;
}
