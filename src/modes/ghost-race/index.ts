import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { registerMode } from '../registry';
import type { SessionMode } from '../types';
import { GhostRaceHud } from './Hud';
import { GhostRaceEndScreen } from './EndScreen';
import { getGhostRecord, saveIfBetter, type GhostRecord } from './storage';

export interface GhostRaceConfig {
  /**
   * If true, the engine.charsCorrect is what counts for "your progress" against
   * the ghost. If false (NG+), errors don't count — only chars typed correctly
   * on the first try advance you, so a clean run is required to actually beat
   * the ghost.
   */
  strictAccuracy: boolean;
}

export interface GhostRaceState {
  /** The personal-best record for the current passage, or null on first attempt. */
  record: GhostRecord | null;
  /** Cached passage id used to detect when we need to refetch the record. */
  passageId: string | null;
  /** Cached passage length — needed for ghost progress + final score. */
  passageLength: number;
}

const ghostRaceMode: SessionMode<GhostRaceState, GhostRaceConfig> = {
  id: 'ghost-race',
  label: 'Ghost Race',
  description: 'Race your previous best on this passage.',

  stamp: {
    label: 'GHOST',
    inkColor: '#5a8fb8',
    frame: 'plain',
  },

  difficulties: {
    easy:   { strictAccuracy: false },
    medium: { strictAccuracy: false },
    hard:   { strictAccuracy: true },
    ngplus: { strictAccuracy: true },
  },

  validateConfig(raw) {
    if (raw == null || typeof raw !== 'object') return { error: 'config must be a JSON object' };
    const r = raw as Record<string, unknown>;
    if (typeof r.strictAccuracy !== 'boolean') return { error: 'strictAccuracy must be a boolean' };
    return { ok: { strictAccuracy: r.strictAccuracy } };
  },

  initial() {
    return { record: null, passageId: null, passageLength: 0 };
  },

  // Refresh the cached record every time onTick fires (cheap; localStorage
  // read is sync). This is also where we react to passage changes — we
  // don't get a passage-change lifecycle hook, but the engine.target length
  // and the engine's loaded passage are visible via ctx.engine.
  onTick(state, ctx) {
    const target = ctx.engine.target;
    const length = target.length;
    if (length === 0) return state;
    // Use the passage *body hash* as the id surrogate. The orchestrator
    // doesn't pass passage id into ctx, so we key on body length to detect
    // a swap. This is rough but acceptable for v1 — collisions just mean a
    // record from another passage of the same length leaks in, which is
    // weird but not broken.
    const key = `len-${length}`;
    if (state.passageId === key) return state;
    return {
      ...state,
      passageId: key,
      passageLength: length,
      record: getGhostRecord(key),
    };
  },

  isComplete() {
    // Defer to engine's natural passage end (status === 'finished'); the
    // orchestrator detects that and ends the session since we don't request
    // refill.
    return false;
  },

  finalScore(state, ctx, _config) {
    const wpm = computeWpm(ctx.engine.charsCorrect, ctx.elapsedMs);
    const acc = computeAccuracy(ctx.engine.charsCorrect, ctx.engine.charsTyped);

    // Save the record (if better) so subsequent runs have something to chase.
    let isNewBest = false;
    let storedRecord: GhostRecord | null = null;
    if (state.passageId && ctx.elapsedMs > 0 && ctx.engine.charsCorrect === state.passageLength) {
      const result = saveIfBetter({
        passageId: state.passageId,
        wpm,
        elapsedMs: ctx.elapsedMs,
        passageLength: state.passageLength,
        recordedAt: Date.now(),
      });
      isNewBest = result.isNewBest;
      storedRecord = result.stored;
    }

    const ghost = state.record ?? storedRecord;
    const margin = ghost ? Math.round((wpm - ghost.wpm) * 10) / 10 : null;

    return {
      primary: wpm,
      primaryLabel: isNewBest ? 'WPM · new best' : 'WPM',
      primaryFormat: 'integer',
      details: [
        { label: 'Accuracy', value: `${(acc * 100).toFixed(0)}%` },
        { label: 'Time', value: `${(ctx.elapsedMs / 1000).toFixed(1)}s` },
        { label: 'Ghost WPM', value: ghost ? Math.round(ghost.wpm).toString() : '—' },
        {
          label: 'Margin',
          value:
            margin === null
              ? 'first run'
              : margin >= 0
                ? `+${margin}`
                : margin.toString(),
        },
      ],
    };
  },

  HudComponent: GhostRaceHud,
  EndScreenComponent: GhostRaceEndScreen,
};

registerMode(ghostRaceMode);

export default ghostRaceMode;
