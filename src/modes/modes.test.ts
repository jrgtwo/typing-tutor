import { beforeEach, describe, expect, it } from 'vitest';
import { listModes, getMode, hasMode } from './index';
import practiceMode from './practice/index';
import raceClockMode from './race-clock/index';
import survivalMode from './survival/index';
import sprintMode from './sprint/index';
import drillMode from './drill/index';
import ghostRaceMode from './ghost-race/index';
import { initialState } from '@/engine/reducer';

describe('mode registry', () => {
  it('registers all modes via the auto-glob', () => {
    const ids = listModes().map((m) => m.id);
    expect(ids).toContain('practice');
    expect(ids).toContain('race-clock');
    expect(ids).toContain('survival');
    expect(ids).toContain('sprint');
    expect(ids).toContain('drill');
    expect(ids).toContain('ghost-race');
  });

  it('hasMode and getMode round-trip', () => {
    expect(hasMode('race-clock')).toBe(true);
    expect(hasMode('not-a-mode')).toBe(false);
    expect(getMode('race-clock')?.id).toBe('race-clock');
  });

  it('every mode declares all four difficulty levels', () => {
    for (const m of listModes()) {
      expect(Object.keys(m.difficulties).sort()).toEqual([
        'easy',
        'hard',
        'medium',
        'ngplus',
      ]);
    }
  });

  it('every mode has a stamp config and validateConfig', () => {
    for (const m of listModes()) {
      expect(m.stamp.label).toBeTruthy();
      expect(m.stamp.inkColor).toMatch(/^#/);
      expect(typeof m.validateConfig).toBe('function');
    }
  });
});

describe('practice mode', () => {
  it('never completes mode-side', () => {
    const cfg = practiceMode.difficulties.medium;
    const state = practiceMode.initial(cfg);
    const ctx = makeCtx(0);
    expect(practiceMode.isComplete(state, ctx, cfg)).toBe(false);
  });

  it('rejects invalid configs', () => {
    expect(practiceMode.validateConfig({})).toMatchObject({ error: expect.any(String) });
    expect(
      practiceMode.validateConfig({
        passageDifficultyMin: 1,
        passageDifficultyMax: 5,
        codeBias: 1,
      }),
    ).toMatchObject({ ok: { passageDifficultyMin: 1, passageDifficultyMax: 5, codeBias: 1 } });
    expect(
      practiceMode.validateConfig({
        passageDifficultyMin: 5,
        passageDifficultyMax: 1,
        codeBias: 0,
      }),
    ).toMatchObject({ error: expect.stringMatching(/min must be/) });
  });
});

describe('race-clock mode', () => {
  const cfg = raceClockMode.difficulties.medium; // 60_000ms

  it('does not end before any input', () => {
    const state = raceClockMode.initial(cfg);
    const ctx = makeCtx(0);
    expect(raceClockMode.isComplete(state, ctx, cfg)).toBe(false);
  });

  it('ends when elapsed exceeds duration', () => {
    const state = raceClockMode.initial(cfg);
    const ctx = makeCtx(60_001);
    expect(raceClockMode.isComplete(state, ctx, cfg)).toBe(true);
  });

  it('asks for refill when configured', () => {
    const state = raceClockMode.initial(cfg);
    const ctx = makeCtx(10_000);
    expect(raceClockMode.shouldRefillPassage?.(state, ctx, cfg)).toBe(true);
  });

  it('validates duration bounds', () => {
    expect(raceClockMode.validateConfig({ durationMs: 1000, autoRefill: true })).toMatchObject({
      error: expect.any(String),
    });
    expect(raceClockMode.validateConfig({ durationMs: 60_000, autoRefill: true })).toMatchObject({
      ok: { durationMs: 60_000, autoRefill: true },
    });
  });
});

describe('survival mode', () => {
  it('initializes with strikesLeft = configured strikes', () => {
    const cfg = survivalMode.difficulties.medium;
    const state = survivalMode.initial(cfg);
    expect(state.strikesLeft).toBe(cfg.strikes);
  });

  it('decrements strikes on a new error', () => {
    const cfg = survivalMode.difficulties.medium; // 3 strikes
    let state = survivalMode.initial(cfg);
    const ctx0 = makeCtxWithEngine({ errors: 1, charsCorrect: 5, charsTyped: 6 });
    state = survivalMode.onKeystroke!(
      state,
      ctx0,
      { key: 'x', correct: false, isBackspace: false },
      cfg,
    );
    expect(state.strikesLeft).toBe(2);
  });

  it('ends when strikes hit zero', () => {
    const cfg = survivalMode.difficulties.hard; // 1 strike
    let state = survivalMode.initial(cfg);
    const ctx = makeCtxWithEngine({ errors: 1, charsCorrect: 0, charsTyped: 1 });
    state = survivalMode.onKeystroke!(
      state,
      ctx,
      { key: 'x', correct: false, isBackspace: false },
      cfg,
    );
    expect(survivalMode.isComplete(state, ctx, cfg)).toBe(true);
  });

  it('blocks backspace only when configured', () => {
    const easy = survivalMode.difficulties.easy;
    const ngplus = survivalMode.difficulties.ngplus;
    const state = survivalMode.initial(ngplus);
    const ctx = makeCtx(0);
    expect(survivalMode.blockBackspace?.(state, ctx, easy)).toBe(false);
    expect(survivalMode.blockBackspace?.(state, ctx, ngplus)).toBe(true);
  });
});

describe('sprint mode', () => {
  const cfg = sprintMode.difficulties.easy; // 10 words

  it('counts words completed on correct space keystrokes', () => {
    let state = sprintMode.initial(cfg);
    const ctx = makeCtxWithEngine({ charsCorrect: 5, charsTyped: 5 });
    state = sprintMode.onKeystroke!(
      state,
      ctx,
      { key: ' ', correct: true, isBackspace: false },
      cfg,
    );
    expect(state.wordsCompleted).toBe(1);
  });

  it('does not count incorrect space keystrokes', () => {
    let state = sprintMode.initial(cfg);
    const ctx = makeCtxWithEngine({ charsCorrect: 4, charsTyped: 5 });
    state = sprintMode.onKeystroke!(
      state,
      ctx,
      { key: ' ', correct: false, isBackspace: false },
      cfg,
    );
    expect(state.wordsCompleted).toBe(0);
  });

  it('completes when targetWords is reached', () => {
    const state = { ...sprintMode.initial(cfg), wordsCompleted: 10 };
    const ctx = makeCtx(0);
    expect(sprintMode.isComplete(state, ctx, cfg)).toBe(true);
  });

  it('refills passages while target not reached', () => {
    const state = { ...sprintMode.initial(cfg), wordsCompleted: 7 };
    const ctx = makeCtx(0);
    expect(sprintMode.shouldRefillPassage?.(state, ctx, cfg)).toBe(true);
  });

  it('rejects invalid configs', () => {
    expect(sprintMode.validateConfig({ targetWords: 0 })).toMatchObject({ error: expect.any(String) });
    expect(sprintMode.validateConfig({ targetWords: 25 })).toMatchObject({ ok: { targetWords: 25 } });
  });
});

describe('drill mode', () => {
  it('returns a synthetic passage from the configured pool', () => {
    const cfg = drillMode.difficulties.easy;
    const state = drillMode.initial(cfg);
    const passage = drillMode.getPassageOverride!(state, cfg, 0);
    expect(passage).not.toBeNull();
    expect(passage!.body.length).toBeGreaterThan(0);
    expect(passage!.id).toContain('drill-easy');
  });

  it('cycles through the pool on successive refills', () => {
    const cfg = drillMode.difficulties.medium;
    const state = drillMode.initial(cfg);
    const a = drillMode.getPassageOverride!(state, cfg, 0)!;
    const b = drillMode.getPassageOverride!(state, cfg, 1)!;
    expect(a.body).not.toBe(b.body);
  });

  it('completes after configured reps', () => {
    const cfg = drillMode.difficulties.easy; // 3 reps
    const state = { ...drillMode.initial(cfg), drillsCompleted: 3 };
    const ctx = makeCtx(0);
    expect(drillMode.isComplete(state, ctx, cfg)).toBe(true);
  });
});

describe('ghost-race mode', () => {
  beforeEach(() => {
    // Vitest defaults to node env, which has no localStorage. Provide a
    // minimal in-memory shim so the storage layer can save and read back.
    const store: Record<string, string> = {};
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    };
  });

  it('returns a config that initializes with no record', () => {
    const cfg = ghostRaceMode.difficulties.medium;
    const state = ghostRaceMode.initial(cfg);
    expect(state.record).toBeNull();
  });

  it('saves a personal best on first finish and reads it back', () => {
    const cfg = ghostRaceMode.difficulties.medium;
    let state = ghostRaceMode.initial(cfg);
    // Simulate a tick that loads the record (first run: nothing stored).
    const tickCtx = makeCtxWithEngine({}, 'hello world');
    state = ghostRaceMode.onTick!(state, tickCtx, 200, cfg);
    expect(state.record).toBeNull();
    expect(state.passageLength).toBe('hello world'.length);

    // Finish the passage with a respectable WPM.
    const finishCtx = makeCtxWithEngineFinished('hello world');
    ghostRaceMode.finalScore(state, finishCtx, cfg);

    // Now a fresh session on the same passage length should have a record.
    let next = ghostRaceMode.initial(cfg);
    next = ghostRaceMode.onTick!(next, tickCtx, 200, cfg);
    expect(next.record).not.toBeNull();
  });
});

function makeCtx(elapsedMs: number) {
  return {
    engine: initialState('prose', ''),
    elapsedMs,
    now: 0,
  };
}

function makeCtxWithEngine(
  overrides: Partial<ReturnType<typeof initialState>>,
  target = 'hello world',
) {
  return {
    engine: { ...initialState('prose', target), ...overrides },
    elapsedMs: 0,
    now: 0,
  };
}

function makeCtxWithEngineFinished(target: string) {
  const base = initialState('prose', target);
  return {
    engine: {
      ...base,
      status: 'finished' as const,
      cursor: target.length,
      typed: target,
      charsCorrect: target.length,
      charsTyped: target.length,
      startedAt: 0,
      finishedAt: 5000,
    },
    elapsedMs: 5000,
    now: 5000,
  };
}
