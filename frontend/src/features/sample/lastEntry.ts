/**
 * Remembers the last project, pen and trial day on this phone,
 * so scoring several samples in a row only needs the Pig ID # and score each time.
 * (Stored only in this browser; if it's cleared, the form simply starts empty.)
 */

export type LastEntry = { projectId: number | null; pen: string; trialDay: string };

const KEY = 'fecalscore.lastEntry';

export function loadLastEntry(): LastEntry {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw);
      return {
        projectId: typeof v.projectId === 'number' ? v.projectId : null,
        pen: typeof v.pen === 'string' ? v.pen : '',
        trialDay: typeof v.trialDay === 'string' ? v.trialDay : '',
      };
    }
  } catch {
    /* storage unavailable (e.g. private browsing) */
  }
  return { projectId: null, pen: '', trialDay: '' };
}

export function saveLastEntry(entry: LastEntry): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(entry));
  } catch {
    /* storage unavailable — nothing to do */
  }
}
