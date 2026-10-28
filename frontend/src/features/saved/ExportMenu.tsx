import { useEffect, useRef, useState } from 'react';
import { exportUrl, type ExportFormat, type SampleQuery } from '../../api/client';
import { DownloadIcon } from '../../components/Icons';
import { filenameFromResponse, makeFile, saveFileToDevice, shareFile } from '../../lib/saveFile';

const OPTIONS: { format: ExportFormat; label: string; note: string }[] = [
  { format: 'csv', label: 'CSV', note: 'Data only, opens anywhere' },
  { format: 'xlsx', label: 'Excel (.xlsx)', note: 'Data with photo links' },
  { format: 'pdf', label: 'PDF report', note: 'Table with thumbnails' },
];

type Props = {
  query: SampleQuery;
  disabled?: boolean;
};

/**
 * "Export" button with CSV / Excel / PDF. Exports exactly what the search and filters show.
 * The file is fetched first and then shared/downloaded, so the app stays on this page.
 */
export default function ExportMenu({ query, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState<File | null>(null); // file waiting for a tap (iPhone)
  const boxRef = useRef<HTMLDivElement>(null);

  // Close when tapping anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Hide the status message after a few seconds.
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  async function handleExport(format: ExportFormat) {
    setBusy(format);
    setMessage(null);
    setReady(null);
    try {
      const res = await fetch(exportUrl(format, query));
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const filename = filenameFromResponse(res, `fecalscore.${format}`);
      const result = await saveFileToDevice(blob, filename);
      if (result === 'needs-tap') {
        setReady(makeFile(blob, filename));
      } else {
        if (result === 'downloaded') setMessage('Export downloaded.');
        setOpen(false);
      }
    } catch {
      setMessage('Export failed. Check your connection and try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="export" ref={boxRef}>
      <button
        type="button"
        className="btn btn-primary export__button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        disabled={disabled}
      >
        <DownloadIcon size={20} />
        {busy ? 'Preparing…' : 'Export'}
      </button>
      {open && (
        <div className="export__menu" role="menu">
          {OPTIONS.map((o) => (
            <button
              key={o.format}
              type="button"
              role="menuitem"
              className="export__item"
              onClick={() => handleExport(o.format)}
              disabled={busy !== null}
            >
              <span className="export__label">{busy === o.format ? 'Preparing…' : o.label}</span>
              <span className="export__note">{o.note}</span>
            </button>
          ))}
          {ready && (
            <button
              type="button"
              className="btn btn-primary export__ready"
              onClick={async () => {
                const result = await shareFile(ready).catch(() => 'cancelled' as const);
                if (result !== 'needs-tap') {
                  setReady(null);
                  setOpen(false);
                }
              }}
            >
              Tap to save {ready.name}
            </button>
          )}
          <p className="export__foot">Exports the samples shown by your search and filters.</p>
        </div>
      )}
      {message && (
        <p className="export__message" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
