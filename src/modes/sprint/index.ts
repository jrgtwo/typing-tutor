import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { registerMode } from '../registry';
import type { SessionMode } from '../types';
import { SprintHud } from './Hud';
import { SprintEndScreen } from './EndScreen';
import { SprintDifficultyEditor } from './DifficultyEditor';

export interface SprintConfig {
  /** Number of correct words to complete before the run ends. */
  targetWords: number;
}

export interface SprintState {
  /** Words completed so far this round (sums across passage refills). */
  wordsCompleted: number;
  /**
   * Snapshot of engine.charsCorrect at the start of the current passage.
   * After a refill the engine resets to 0; we use this baseline to detect
   * word boundaries with `engine.charsCorrect - baseline`.
   */
  passageStartCharsCorrect: number;
  /** Aggregate stats banked from completed passages. */
  totalCharsCorrect: number;
  totalCharsTyped: number;
  totalErrors: number;
}

const sprintMode: SessionMode<SprintState, SprintConfig> = {
  id: 'sprint',
  label: 'Sprint',
  description: 'Fixed word count. Race for the fastest finish.',

  stamp: {
    label: 'SPRINT',
    inkColor: '#7a4ec8',
    frame: 'starburst',
  },

  difficulties: {
    easy:   { targetWords: 10 },
    medium: { targetWords: 25 },
    hard:   { targetWords: 50 },
    ngplus: { targetWords: 100 },
  },

  validateConfig(raw) {
    if (raw == null || typeof raw !== 'object') return { error: 'config must be a JSON object' };
    const r = raw as Record<string, unknown>;
    const n = Number(r.targetWords);
    if (!Number.isFinite(n)) return { error: 'targetWords must be a number' };
    if (n < 1 || n > 1000) return { error: 'targetWords must be 1-1000' };
    return { ok: { targetWords: Math.round(n) } };
  },

  initial() {
    return {
      wordsCompleted: 0,
      passageStartCharsCorrect: 0,
      totalCharsCorrect: 0,
      totalCharsTyped: 0,
      totalErrors: 0,
    };
  },

  onKeystroke(state, ctx, evt) {
    if (evt.isBackspace) return state;
    // A "word completed" is a correct keystroke that lands a whitespace
    // character (space, newline, tab) — i.e. the user just finished a
    // run of non-whitespace.
    const isWordBoundary =
      evt.correct && (evt.key === ' ' || evt.key === 'Enter' || evt.key === 'Tab');
    if (!isWordBoundary) return state;

    return {
      ...state,
      wordsCompleted: state.wordsCompleted + 1,
      // keep aggregate stats roughly in sync so the HUD's WPM is sensible
      // even mid-passage. Final stats are computed in finalScore.
      totalCharsCorrect: state.totalCharsCorrect + (ctx.engine.charsCorrect - state.passageStartCharsCorrect),
    };
  },

  isComplete(state, _ctx, config) {
    return state.wordsCompleted >= config.targetWords;
  },

  shouldRefillPassage(state, _ctx, config) {
    return state.wordsCompleted < config.targetWords;
  },

  onPassageRefill(state, ctx) {
    return {
      ...state,
      totalCharsCorrect:
        state.totalCharsCorrect +
        Math.max(0, ctx.engine.charsCorrect - state.passageStartCharsCorrect),
      totalCharsTyped:
        state.totalCharsTyped +
        Math.max(0, ctx.engine.charsTyped),
      totalErrors: state.totalErrors + Math.max(0, ctx.engine.errors),
      passageStartCharsCorrect: 0,
    };
  },

  finalScore(state, ctx, config) {
    const totalCorrect =
      state.totalCharsCorrect + Math.max(0, ctx.engine.charsCorrect - state.passageStartCharsCorrect);
    const totalTyped = state.totalCharsTyped + Math.max(0, ctx.engine.charsTyped);
    const totalErrors = state.totalErrors + Math.max(0, ctx.engine.errors);
    const wpm = computeWpm(totalCorrect, ctx.elapsedMs);
    const acc = computeAccuracy(totalCorrect, totalTyped);

    return {
      primary: ctx.elapsedMs,
      primaryLabel: 'Finish Time',
      primaryFormat: 'duration-ms',
      details: [
        { label: 'WPM', value: Math.round(wpm).toString() },
        { label: 'Accuracy', value: `${(acc * 100).toFixed(0)}%` },
        { label: 'Words', value: `${state.wordsCompleted}/${config.targetWords}` },
        { label: 'Errors', value: totalErrors.toString() },
      ],
    };
  },

  HudComponent: SprintHud,
  EndScreenComponent: SprintEndScreen,
  DifficultyConfigEditor: SprintDifficultyEditor,
};

registerMode(sprintMode);

export default sprintMode;
