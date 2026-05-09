import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { registerMode } from '../registry';
import type { Difficulty, SessionMode } from '../types';
import { DrillHud } from './Hud';
import { DrillEndScreen } from './EndScreen';
import { DRILL_PASSAGES } from './passages';

export interface DrillConfig {
  /**
   * Which difficulty pool to draw from. Storing this in the per-difficulty
   * config (rather than implicitly using the active difficulty) makes admin
   * overrides explicit — an admin could swap "hard" to draw from the
   * symbols pool, for instance.
   */
  pool: Difficulty;
  /** Number of consecutive drill passages to complete before the round ends. */
  reps: number;
}

export interface DrillState {
  /** How many drill passages the user has completed this round. */
  drillsCompleted: number;
  /** Engine charsCorrect at the start of the current passage (for delta). */
  passageStartCharsCorrect: number;
  totalCharsCorrect: number;
  totalCharsTyped: number;
  totalErrors: number;
}

const drillMode: SessionMode<DrillState, DrillConfig> = {
  id: 'drill',
  label: 'Drill',
  description: 'Hammer the keys you mistype most.',

  stamp: {
    label: 'DRILL',
    inkColor: '#3a8b6c',
    frame: 'plain',
  },

  difficulties: {
    easy:   { pool: 'easy',   reps: 3 },
    medium: { pool: 'medium', reps: 4 },
    hard:   { pool: 'hard',   reps: 5 },
    ngplus: { pool: 'ngplus', reps: 5 },
  },

  validateConfig(raw) {
    if (raw == null || typeof raw !== 'object') return { error: 'config must be a JSON object' };
    const r = raw as Record<string, unknown>;
    const pool = r.pool;
    if (pool !== 'easy' && pool !== 'medium' && pool !== 'hard' && pool !== 'ngplus') {
      return { error: 'pool must be easy|medium|hard|ngplus' };
    }
    const n = Number(r.reps);
    if (!Number.isFinite(n)) return { error: 'reps must be a number' };
    if (n < 1 || n > 50) return { error: 'reps must be 1-50' };
    return { ok: { pool, reps: Math.round(n) } };
  },

  initial() {
    return {
      drillsCompleted: 0,
      passageStartCharsCorrect: 0,
      totalCharsCorrect: 0,
      totalCharsTyped: 0,
      totalErrors: 0,
    };
  },

  getPassageOverride(_state, config, refillCount) {
    const pool = DRILL_PASSAGES[config.pool] ?? DRILL_PASSAGES.medium;
    const passage = pool[refillCount % pool.length];
    return {
      id: `drill-${config.pool}-${passage.id}-${refillCount}`,
      title: `drill · ${config.pool}`,
      body: passage.body,
      modeId: config.pool === 'ngplus' ? 'code' : 'prose',
    };
  },

  isComplete(state, _ctx, config) {
    return state.drillsCompleted >= config.reps;
  },

  shouldRefillPassage(state, _ctx, config) {
    return state.drillsCompleted + 1 < config.reps;
  },

  onPassageRefill(state, ctx) {
    return {
      ...state,
      drillsCompleted: state.drillsCompleted + 1,
      totalCharsCorrect:
        state.totalCharsCorrect +
        Math.max(0, ctx.engine.charsCorrect - state.passageStartCharsCorrect),
      totalCharsTyped: state.totalCharsTyped + Math.max(0, ctx.engine.charsTyped),
      totalErrors: state.totalErrors + Math.max(0, ctx.engine.errors),
      passageStartCharsCorrect: 0,
    };
  },

  finalScore(state, ctx, config) {
    // Account for the final passage that wasn't rolled over by onPassageRefill.
    const totalCorrect =
      state.totalCharsCorrect + Math.max(0, ctx.engine.charsCorrect - state.passageStartCharsCorrect);
    const totalTyped = state.totalCharsTyped + Math.max(0, ctx.engine.charsTyped);
    const totalErrors = state.totalErrors + Math.max(0, ctx.engine.errors);
    const wpm = computeWpm(totalCorrect, ctx.elapsedMs);
    const acc = computeAccuracy(totalCorrect, totalTyped);

    return {
      primary: acc,
      primaryLabel: 'Accuracy',
      primaryFormat: 'percent',
      details: [
        { label: 'WPM', value: Math.round(wpm).toString() },
        { label: 'Drills', value: `${state.drillsCompleted + 1}/${config.reps}` },
        { label: 'Errors', value: totalErrors.toString() },
        { label: 'Pool', value: config.pool },
      ],
    };
  },

  HudComponent: DrillHud,
  EndScreenComponent: DrillEndScreen,
};

registerMode(drillMode);

export default drillMode;
