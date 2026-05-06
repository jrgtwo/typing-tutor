import { describe, expect, it } from 'vitest';
import { can, type PlanProfile } from './plan';

const free: PlanProfile = { plan: 'free', plan_expires_at: null };
const pro: PlanProfile = { plan: 'pro', plan_expires_at: null };
const power: PlanProfile = { plan: 'power', plan_expires_at: null };

describe('can() — free plan', () => {
  it('grants the free-tier capabilities', () => {
    expect(can(free, 'analytics.heatmap')).toBe(true);
    expect(can(free, 'analytics.session_history')).toBe(true);
    expect(can(free, 'content.unlimited')).toBe(true);
  });

  it('denies paid-tier capabilities', () => {
    expect(can(free, 'analytics.keystroke_replay')).toBe(false);
    expect(can(free, 'ads.hidden')).toBe(false);
    expect(can(free, 'raccoon.dynamic')).toBe(false);
  });
});

describe('can() — pro plan', () => {
  it('unlocks keystroke replay and hides ads', () => {
    expect(can(pro, 'analytics.keystroke_replay')).toBe(true);
    expect(can(pro, 'ads.hidden')).toBe(true);
  });

  it('still does not include power-only capabilities', () => {
    expect(can(pro, 'raccoon.dynamic')).toBe(false);
  });
});

describe('can() — power plan', () => {
  it('unlocks dynamic raccoon', () => {
    expect(can(power, 'raccoon.dynamic')).toBe(true);
    expect(can(power, 'ads.hidden')).toBe(true);
  });
});

describe('can() — null/undefined profile', () => {
  it('treats missing profile as free', () => {
    expect(can(null, 'analytics.heatmap')).toBe(true);
    expect(can(null, 'analytics.keystroke_replay')).toBe(false);
    expect(can(undefined, 'ads.hidden')).toBe(false);
  });
});

describe('can() — expired plans', () => {
  it('expired pro is treated as free', () => {
    const expired: PlanProfile = {
      plan: 'pro',
      plan_expires_at: new Date(Date.now() - 86_400_000).toISOString(),
    };
    expect(can(expired, 'analytics.keystroke_replay')).toBe(false);
    expect(can(expired, 'ads.hidden')).toBe(false);
  });

  it('not-yet-expired pro retains its capabilities', () => {
    const future: PlanProfile = {
      plan: 'pro',
      plan_expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    };
    expect(can(future, 'analytics.keystroke_replay')).toBe(true);
  });
});
