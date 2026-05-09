/**
 * Per-passage personal-best storage for Ghost Race. Lives in localStorage
 * keyed by passage id. Server-side persistence is deferred until the paid
 * tier ships keystroke replay (`analytics.keystroke_replay` capability).
 */

const STORAGE_KEY = 'keybandit:ghost-bests';

export interface GhostRecord {
  passageId: string;
  /** Words-per-minute (correct chars / 5 / minutes). */
  wpm: number;
  /** Total ms from first keystroke to passage finish. */
  elapsedMs: number;
  /** Total characters in the passage at the time of recording. */
  passageLength: number;
  /** Wall-clock ms when the record was set. */
  recordedAt: number;
}

type RecordMap = Record<string, GhostRecord>;

function readAll(): RecordMap {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: RecordMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && typeof v === 'object') {
        const r = v as Record<string, unknown>;
        if (
          typeof r.passageId === 'string' &&
          typeof r.wpm === 'number' &&
          typeof r.elapsedMs === 'number' &&
          typeof r.passageLength === 'number' &&
          typeof r.recordedAt === 'number'
        ) {
          out[k] = {
            passageId: r.passageId,
            wpm: r.wpm,
            elapsedMs: r.elapsedMs,
            passageLength: r.passageLength,
            recordedAt: r.recordedAt,
          };
        }
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function getGhostRecord(passageId: string): GhostRecord | null {
  return readAll()[passageId] ?? null;
}

/**
 * Save the run if it beats the existing record (or there is no record).
 * Returns the record actually stored, which may be the existing one if the
 * new run was slower.
 */
export function saveIfBetter(record: GhostRecord): { stored: GhostRecord; isNewBest: boolean } {
  const all = readAll();
  const prev = all[record.passageId];
  if (prev && prev.wpm >= record.wpm) {
    return { stored: prev, isNewBest: false };
  }
  all[record.passageId] = record;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // best-effort
  }
  return { stored: record, isNewBest: true };
}

/**
 * Linear ghost progress in characters at the given elapsed time. The ghost
 * is modeled as moving at a constant pace through the passage — that's an
 * approximation, but without keystroke timestamps it's the best we can do
 * and matches user expectations for "race a personal best."
 */
export function ghostCharsAt(record: GhostRecord, elapsedMs: number): number {
  if (record.elapsedMs <= 0) return 0;
  const fraction = Math.min(1, elapsedMs / record.elapsedMs);
  return Math.floor(fraction * record.passageLength);
}
