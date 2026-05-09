import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { registerMode } from '../registry';
import type { SessionMode } from '../types';
import { SurvivalHud } from './Hud';
import { SurvivalEndScreen } from './EndScreen';
import { SurvivalDifficultyEditor } from './DifficultyEditor';

export interface SurvivalConfig {
  /** Number of typos allowed before the round ends. */
  strikes: number;
  /** When true, backspace input is suppressed (NG+). */
  banBackspace: boolean;
}

export interface SurvivalState {
  /** Strikes remaining. Starts at config.strikes; round ends when it reaches 0. */
  strikesLeft: number;
  /** Engine errors at the moment of the most recent strike consumption. */
  errorsBaseline: number;
  /** Snapshot for end-screen stats. */
  charsSurvived: number;
  charsTyped: number;
}

const survivalMode: SessionMode<SurvivalState, SurvivalConfig> = {
  id: 'survival',
  label: 'Survival',
  description: 'Three strikes. Type clean or the desk gets flipped.',

  stamp: {
    label: 'SURVIVE',
    inkColor: '#1a1a1a',
    frame: 'skull',
  },

  difficulties: {
    easy:   { strikes: 5, banBackspace: false },
    medium: { strikes: 3, banBackspace: false },
    hard:   { strikes: 1, banBackspace: false },
    ngplus: { strikes: 1, banBackspace: true },
  },

  validateConfig(raw) {
    if (raw == null || typeof raw !== 'object') return { error: 'config must be a JSON object' };
    const r = raw as Record<string, unknown>;
    const s = Number(r.strikes);
    if (!Number.isFinite(s)) return { error: 'strikes must be a number' };
    if (s < 1 || s > 20) return { error: 'strikes must be 1-20' };
    if (typeof r.banBackspace !== 'boolean') return { error: 'banBackspace must be a boolean' };
    return { ok: { strikes: Math.round(s), banBackspace: r.banBackspace } };
  },

  initial(config) {
    return {
      strikesLeft: config.strikes,
      errorsBaseline: 0,
      charsSurvived: 0,
      charsTyped: 0,
    };
  },

  onKeystroke(state, ctx, evt) {
    if (evt.isBackspace) return state;
    // The engine has already accepted the keystroke and bumped errors if it
    // was wrong. Compare to baseline to detect a new error this round.
    const errorsNow = ctx.engine.errors;
    const newErrors = errorsNow - state.errorsBaseline;
    const strikesConsumed = newErrors > 0 ? newErrors : 0;
    if (strikesConsumed === 0) {
      return {
        ...state,
        charsSurvived: ctx.engine.charsCorrect,
        charsTyped: ctx.engine.charsTyped,
      };
    }
    return {
      ...state,
      strikesLeft: Math.max(0, state.strikesLeft - strikesConsumed),
      errorsBaseline: errorsNow,
      charsSurvived: ctx.engine.charsCorrect,
      charsTyped: ctx.engine.charsTyped,
    };
  },

  isComplete(state) {
    return state.strikesLeft <= 0;
  },

  blockBackspace(_state, _ctx, config) {
    return config.banBackspace;
  },

  finalScore(state, ctx, config) {
    const charsSurvived = state.charsSurvived || ctx.engine.charsCorrect;
    const charsTyped = state.charsTyped || ctx.engine.charsTyped;
    const wpm = computeWpm(charsSurvived, ctx.elapsedMs);
    const acc = computeAccuracy(charsSurvived, charsTyped);
    const strikesUsed = config.strikes - state.strikesLeft;
    return {
      primary: charsSurvived,
      primaryLabel: 'Chars Survived',
      primaryFormat: 'integer',
      details: [
        { label: 'WPM', value: Math.round(wpm).toString() },
        { label: 'Accuracy', value: `${(acc * 100).toFixed(0)}%` },
        { label: 'Strikes', value: `${strikesUsed}/${config.strikes}` },
        { label: 'Time', value: `${(ctx.elapsedMs / 1000).toFixed(1)}s` },
      ],
    };
  },

  HudComponent: SurvivalHud,
  EndScreenComponent: SurvivalEndScreen,
  DifficultyConfigEditor: SurvivalDifficultyEditor,
};

registerMode(survivalMode);

export default survivalMode;
