import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { registerMode } from '../registry';
import type { SessionMode } from '../types';
import { RaceClockHud } from './Hud';
import { RaceClockEndScreen } from './EndScreen';
import { RaceClockDifficultyEditor } from './DifficultyEditor';

export interface RaceClockConfig {
  /** Total time budget for the round, in ms. */
  durationMs: number;
  /**
   * Whether to auto-refill the passage if the engine finishes it before time
   * runs out. NG+ keeps it true but draws from a harder pool (set in the
   * future via passage-pool integration; for v1 it's just a flag).
   */
  autoRefill: boolean;
}

interface RaceClockState {
  /**
   * Snapshot of charsCorrect/charsTyped/errors aggregated across passages.
   * Auto-refill resets the engine, so we can't read aggregate stats from the
   * engine alone.
   */
  charsCorrect: number;
  charsTyped: number;
  errors: number;
  /** Engine snapshot at the start of the current passage, so we can compute deltas after a refill. */
  passageStartCharsCorrect: number;
  passageStartCharsTyped: number;
  passageStartErrors: number;
}

const raceClockMode: SessionMode<RaceClockState, RaceClockConfig> = {
  id: 'race-clock',
  label: 'Race the Clock',
  description: 'Type as much as you can before time runs out.',

  stamp: {
    label: 'RACE',
    inkColor: '#c0392b',
    frame: 'starburst',
  },

  difficulties: {
    easy:   { durationMs: 120_000, autoRefill: true },
    medium: { durationMs: 60_000,  autoRefill: true },
    hard:   { durationMs: 30_000,  autoRefill: true },
    ngplus: { durationMs: 15_000,  autoRefill: true },
  },

  validateConfig(raw) {
    if (raw == null || typeof raw !== 'object') return { error: 'config must be a JSON object' };
    const r = raw as Record<string, unknown>;
    const dur = Number(r.durationMs);
    if (!Number.isFinite(dur)) return { error: 'durationMs must be a number' };
    if (dur < 5_000 || dur > 600_000) return { error: 'durationMs must be 5_000-600_000' };
    if (typeof r.autoRefill !== 'boolean') return { error: 'autoRefill must be a boolean' };
    return { ok: { durationMs: Math.round(dur), autoRefill: r.autoRefill } };
  },

  initial() {
    return {
      charsCorrect: 0,
      charsTyped: 0,
      errors: 0,
      passageStartCharsCorrect: 0,
      passageStartCharsTyped: 0,
      passageStartErrors: 0,
    };
  },

  onTick(state, _ctx, _dtMs, _config) {
    // Time-driven, no per-tick state mutation needed; isComplete handles the
    // end check directly off elapsedMs vs config.durationMs.
    return state;
  },

  isComplete(_state, ctx, config) {
    // Only end after the user has actually started typing — otherwise the
    // round would auto-end immediately on selection if elapsedMs were 0 and
    // the orchestrator polled before any input.
    if (ctx.elapsedMs <= 0) return false;
    return ctx.elapsedMs >= config.durationMs;
  },

  shouldRefillPassage(_state, _ctx, config) {
    return config.autoRefill;
  },

  onPassageRefill(state, ctx) {
    const deltaCorrect = ctx.engine.charsCorrect - state.passageStartCharsCorrect;
    const deltaTyped = ctx.engine.charsTyped - state.passageStartCharsTyped;
    const deltaErrors = ctx.engine.errors - state.passageStartErrors;
    return {
      charsCorrect: state.charsCorrect + Math.max(0, deltaCorrect),
      charsTyped: state.charsTyped + Math.max(0, deltaTyped),
      errors: state.errors + Math.max(0, deltaErrors),
      // The engine resets to 0 after refill, so next-passage baselines are 0.
      passageStartCharsCorrect: 0,
      passageStartCharsTyped: 0,
      passageStartErrors: 0,
    };
  },

  finalScore(state, ctx, config) {
    // Aggregate engine stats from the *current* passage with whatever was
    // banked from previous passages this round.
    const engineDeltaCorrect = ctx.engine.charsCorrect - state.passageStartCharsCorrect;
    const engineDeltaTyped = ctx.engine.charsTyped - state.passageStartCharsTyped;
    const engineDeltaErrors = ctx.engine.errors - state.passageStartErrors;

    const totalCorrect = state.charsCorrect + Math.max(0, engineDeltaCorrect);
    const totalTyped = state.charsTyped + Math.max(0, engineDeltaTyped);
    const totalErrors = state.errors + Math.max(0, engineDeltaErrors);

    const wpm = computeWpm(totalCorrect, config.durationMs);
    const acc = computeAccuracy(totalCorrect, totalTyped);
    const netWpm = wpm * acc;

    return {
      primary: netWpm,
      primaryLabel: 'Net WPM',
      primaryFormat: 'integer',
      details: [
        { label: 'Accuracy', value: `${(acc * 100).toFixed(0)}%` },
        { label: 'Chars', value: totalCorrect.toString() },
        { label: 'Errors', value: totalErrors.toString() },
        { label: 'Window', value: `${Math.round(config.durationMs / 1000)}s` },
      ],
    };
  },

  HudComponent: RaceClockHud,
  EndScreenComponent: RaceClockEndScreen,
  DifficultyConfigEditor: RaceClockDifficultyEditor,
};

registerMode(raceClockMode);

export default raceClockMode;
