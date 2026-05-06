import { describe, expect, it } from 'vitest';
import { computeAccuracy, computeWpm } from './metrics';

describe('computeWpm', () => {
  it('300 correct chars in 60s = 60 WPM (chars/5 / minutes)', () => {
    expect(computeWpm(300, 60_000)).toBeCloseTo(60, 6);
  });

  it('150 correct chars in 30s = 60 WPM', () => {
    expect(computeWpm(150, 30_000)).toBeCloseTo(60, 6);
  });

  it('returns 0 when elapsedMs is zero or negative', () => {
    expect(computeWpm(100, 0)).toBe(0);
    expect(computeWpm(100, -500)).toBe(0);
  });

  it('zero correct chars yields zero WPM', () => {
    expect(computeWpm(0, 60_000)).toBe(0);
  });
});

describe('computeAccuracy', () => {
  it('returns charsCorrect / charsTyped', () => {
    expect(computeAccuracy(95, 100)).toBeCloseTo(0.95, 6);
  });

  it('returns 1 (perfect) when nothing has been typed yet', () => {
    expect(computeAccuracy(0, 0)).toBe(1);
  });

  it('returns 0 when no chars are correct', () => {
    expect(computeAccuracy(0, 25)).toBe(0);
  });
});
