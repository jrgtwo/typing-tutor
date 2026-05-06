import { describe, expect, it } from 'vitest';
import { initialState, reduce } from '../reducer';
import { codeMode } from './code';

describe('codeMode.normalize', () => {
  it('converts CRLF to LF but preserves all other whitespace', () => {
    const out = codeMode.normalize('a\r\n  b\t\tc');
    expect(out).toBe('a\n  b\t\tc');
  });

  it('does NOT collapse runs of spaces (unlike prose)', () => {
    expect(codeMode.normalize('foo    bar')).toBe('foo    bar');
  });
});

describe('codeMode auto-indent via reducer', () => {
  it('after a correct Enter, cursor jumps past the next line indent', () => {
    // target: "{\n    x" — Enter should auto-skip 4 spaces.
    let s = initialState('code', '{\n    x');
    s = reduce(s, { type: 'start', at: 1000 });
    s = reduce(s, { type: 'keydown', key: '{', at: 1100 });
    expect(s.cursor).toBe(1);
    s = reduce(s, { type: 'keydown', key: 'Enter', at: 1200 });
    // 1 (newline) + 4 (auto-indent) = 5
    expect(s.cursor).toBe(6);
    expect(s.charsCorrect).toBe(6);
    expect(s.charsTyped).toBe(6);
    s = reduce(s, { type: 'keydown', key: 'x', at: 1300 });
    expect(s.cursor).toBe(7);
    expect(s.status).toBe('finished');
  });

  it('Tab counts as a single character keystroke matching \\t', () => {
    let s = initialState('code', '\tend');
    s = reduce(s, { type: 'start', at: 1000 });
    s = reduce(s, { type: 'keydown', key: 'Tab', at: 1100 });
    expect(s.cursor).toBe(1);
    expect(s.charsCorrect).toBe(1);
    expect(s.errors).toBe(0);
  });

  it('no auto-indent when the next line has no leading whitespace', () => {
    let s = initialState('code', 'a\nb');
    s = reduce(s, { type: 'start', at: 1000 });
    s = reduce(s, { type: 'keydown', key: 'a', at: 1100 });
    s = reduce(s, { type: 'keydown', key: 'Enter', at: 1200 });
    expect(s.cursor).toBe(2);
    expect(s.charsCorrect).toBe(2);
  });
});
