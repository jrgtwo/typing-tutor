import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { registerMode } from '../registry';
import type { SessionMode } from '../types';
import { PracticeHud } from './Hud';
import { PracticeEndScreen } from './EndScreen';

export interface PracticeConfig {
  /**
   * Inclusive difficulty range for picking passages from the catalog. content_items.difficulty
   * is 1-5; this lets each level draw from a curated band.
   */
  passageDifficultyMin: number;
  passageDifficultyMax: number;
  /** Whether to bias toward code passages (NG+). 0 = prose-only, 1 = mixed, 2 = code-heavy. */
  codeBias: 0 | 1 | 2;
}

interface PracticeState {
  /** Practice has no internal mode state — the engine alone drives it. */
  readonly _kind: 'practice';
}

const STATE: PracticeState = { _kind: 'practice' };

const practiceMode: SessionMode<PracticeState, PracticeConfig> = {
  id: 'practice',
  label: 'Practice',
  description: 'Free-form. No timer. No fail state. Just type.',

  stamp: {
    label: 'PRACTICE',
    inkColor: '#3a5b9c',
    frame: 'plain',
  },

  difficulties: {
    easy:   { passageDifficultyMin: 1, passageDifficultyMax: 2, codeBias: 0 },
    medium: { passageDifficultyMin: 2, passageDifficultyMax: 3, codeBias: 1 },
    hard:   { passageDifficultyMin: 3, passageDifficultyMax: 5, codeBias: 1 },
    ngplus: { passageDifficultyMin: 4, passageDifficultyMax: 5, codeBias: 2 },
  },

  validateConfig(raw) {
    if (raw == null || typeof raw !== 'object') return { error: 'config must be a JSON object' };
    const r = raw as Record<string, unknown>;
    const min = numberOrError(r.passageDifficultyMin, 'passageDifficultyMin');
    if ('error' in min) return min;
    const max = numberOrError(r.passageDifficultyMax, 'passageDifficultyMax');
    if ('error' in max) return max;
    if (min.value < 1 || min.value > 5) return { error: 'passageDifficultyMin must be 1-5' };
    if (max.value < 1 || max.value > 5) return { error: 'passageDifficultyMax must be 1-5' };
    if (min.value > max.value) return { error: 'min must be <= max' };
    const biasRaw = r.codeBias;
    const bias = biasRaw === 0 || biasRaw === 1 || biasRaw === 2 ? biasRaw : null;
    if (bias === null) return { error: 'codeBias must be 0, 1, or 2' };
    return {
      ok: {
        passageDifficultyMin: min.value,
        passageDifficultyMax: max.value,
        codeBias: bias,
      },
    };
  },

  initial() {
    return STATE;
  },

  isComplete() {
    // Practice never ends mode-side — the session ends when the engine finishes the passage.
    return false;
  },

  finalScore(_state, ctx) {
    const wpm = computeWpm(ctx.engine.charsCorrect, ctx.elapsedMs);
    const acc = computeAccuracy(ctx.engine.charsCorrect, ctx.engine.charsTyped);
    return {
      primary: wpm,
      primaryLabel: 'WPM',
      primaryFormat: 'integer',
      details: [
        { label: 'Accuracy', value: `${(acc * 100).toFixed(0)}%` },
        { label: 'Errors', value: ctx.engine.errors.toString() },
        { label: 'Chars', value: ctx.engine.charsCorrect.toString() },
        { label: 'Time', value: `${(ctx.elapsedMs / 1000).toFixed(1)}s` },
      ],
    };
  },

  HudComponent: PracticeHud,
  EndScreenComponent: PracticeEndScreen,
};

function numberOrError(raw: unknown, name: string): { value: number } | { error: string } {
  const n = Number(raw);
  if (!Number.isFinite(n)) return { error: `${name} must be a number` };
  return { value: Math.round(n) };
}

registerMode(practiceMode);

export default practiceMode;
