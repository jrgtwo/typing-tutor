import { describe, expect, it } from 'vitest';
import { initialState, reduce } from './reducer';
import type { EngineState } from './types';

function startedState(modeId: 'prose' | 'code', target: string): EngineState {
  return reduce(initialState(modeId, target), { type: 'start', at: 1000 });
}

function typeChars(state: EngineState, chars: string, baseAt = 2000): EngineState {
  let s = state;
  let at = baseAt;
  for (const ch of chars) {
    s = reduce(s, { type: 'keydown', key: ch, at });
    at += 100;
  }
  return s;
}

describe('initialState', () => {
  it('normalizes prose targets (collapses whitespace, smart quotes)', () => {
    const s = initialState('prose', 'hello   “world”');
    expect(s.target).toBe('hello "world"');
    expect(s.status).toBe('idle');
    expect(s.cursor).toBe(0);
  });

  it('preserves whitespace in code mode', () => {
    const s = initialState('code', 'function () {\n    return 1;\n}');
    expect(s.target).toBe('function () {\n    return 1;\n}');
  });
});

describe('reducer state machine', () => {
  it('first keydown transitions idle → running and sets startedAt', () => {
    const s0 = initialState('prose', 'hi');
    const s1 = reduce(s0, { type: 'keydown', key: 'h', at: 5000 });
    expect(s1.status).toBe('running');
    expect(s1.startedAt).toBe(5000);
  });

  it('correct char advances cursor and bumps charsCorrect/charsTyped', () => {
    const s = typeChars(startedState('prose', 'hi'), 'h');
    expect(s.cursor).toBe(1);
    expect(s.charsCorrect).toBe(1);
    expect(s.charsTyped).toBe(1);
    expect(s.errors).toBe(0);
  });

  it('wrong char advances cursor anyway, bumps errors and charsTyped, leaves charsCorrect', () => {
    const s = typeChars(startedState('prose', 'hi'), 'x');
    expect(s.cursor).toBe(1);
    expect(s.charsCorrect).toBe(0);
    expect(s.charsTyped).toBe(1);
    expect(s.errors).toBe(1);
  });

  it('Backspace walks cursor back without decrementing monotonic counters', () => {
    let s = typeChars(startedState('prose', 'hi'), 'x');
    expect(s.errors).toBe(1);
    s = reduce(s, { type: 'keydown', key: 'Backspace', at: 3000 });
    expect(s.cursor).toBe(0);
    expect(s.errors).toBe(1);
    expect(s.charsTyped).toBe(1);
    expect(s.charsCorrect).toBe(0);
  });

  it('Backspace at cursor 0 is a no-op for state but still records lastKey', () => {
    const s0 = startedState('prose', 'hi');
    const s = reduce(s0, { type: 'keydown', key: 'Backspace', at: 3000 });
    expect(s.cursor).toBe(0);
    expect(s.lastKey).toBe('Backspace');
  });

  it('reaching target.length flips status to finished', () => {
    const s = typeChars(startedState('prose', 'hi'), 'hi');
    expect(s.status).toBe('finished');
    expect(s.cursor).toBe(2);
  });

  it('keyStats accumulates against the EXPECTED key, not the typed one', () => {
    const s = typeChars(startedState('prose', 'ab'), 'x');
    // expected first char is 'a'; the wrong press should attribute to 'a'.
    expect(s.keyStats.a?.presses).toBe(1);
    expect(s.keyStats.a?.errors).toBe(1);
    expect(s.keyStats.x).toBeUndefined();
  });

  it('reset returns to a fresh state with the same target/mode', () => {
    const s = typeChars(startedState('prose', 'hello'), 'hel');
    const r = reduce(s, { type: 'reset' });
    expect(r.status).toBe('idle');
    expect(r.cursor).toBe(0);
    expect(r.charsTyped).toBe(0);
    expect(r.target).toBe('hello');
  });

  it('non-character keys (e.g. Shift) do not advance cursor', () => {
    const s = reduce(startedState('prose', 'hi'), {
      type: 'keydown',
      key: 'Shift',
      at: 2000,
    });
    expect(s.cursor).toBe(0);
    expect(s.charsTyped).toBe(0);
    expect(s.lastKey).toBe('Shift');
  });
});
