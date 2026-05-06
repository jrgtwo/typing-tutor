import { useEffect, useRef } from 'react';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import type { RaccoonFrequency } from '@/lib/queries';
import {
  ERROR_QUIPS,
  GREETING_QUIPS,
  IDLE_QUIPS,
  pickFinishQuip,
  pickOne,
  type Mood,
  type Quip,
} from './quips';

export type Side = 'left' | 'right' | 'bottom-left' | 'bottom-right';

export interface Cameo {
  id: number;
  side: Side;
  mood: Mood;
  quip: string;
  duration: number;
}

export type Setter = (cameo: Cameo) => void;

export interface CameoOptions {
  /** null means "no cameo currently visible". Used by idle to stay polite. */
  current: Cameo | null;
  setCameo: Setter;
  nextId: () => number;
  /** Frequency multiplier — 'off' suppresses entirely. */
  frequency: RaccoonFrequency;
}

const FREQUENCY_FACTOR: Record<RaccoonFrequency, number> = {
  chatty: 1,
  normal: 1.5,
  rare: 3,
  off: Infinity,
};

function pickSide(): Side {
  const sides: Side[] = ['left', 'right', 'bottom-left', 'bottom-right'];
  return sides[Math.floor(Math.random() * sides.length)];
}

function buildCameo(id: number, q: Quip, duration: number): Cameo {
  return { id, side: pickSide(), mood: q.mood, quip: q.text, duration };
}

/** Greeting cameo — fires once shortly after mount. Skipped on 'off'. */
export function useGreetingCameo({ frequency, setCameo, nextId }: CameoOptions) {
  useEffect(() => {
    if (frequency === 'off') return;
    // Rare users only get the greeting half the time.
    if (frequency === 'rare' && Math.random() < 0.5) return;
    const t = setTimeout(() => {
      setCameo(buildCameo(nextId(), pickOne(GREETING_QUIPS), 3600));
    }, 900);
    return () => clearTimeout(t);
    // mount-only by design; frequency captured at mount is fine
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Finish cameo — fires when status flips to 'finished'. Always fires unless 'off'. */
export function useFinishCameo({ frequency, setCameo, nextId }: CameoOptions) {
  const status = useEngineStore((s) => s.status);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const prevStatus = useRef(status);

  useEffect(() => {
    if (frequency === 'off') {
      prevStatus.current = status;
      return;
    }
    if (prevStatus.current !== 'finished' && status === 'finished') {
      const elapsed = startedAt && finishedAt ? finishedAt - startedAt : 0;
      const wpm = computeWpm(charsCorrect, elapsed);
      const acc = computeAccuracy(charsCorrect, charsTyped);
      setCameo(buildCameo(nextId(), pickFinishQuip(wpm, acc), 6500));
    }
    prevStatus.current = status;
  }, [status, startedAt, finishedAt, charsCorrect, charsTyped, frequency, setCameo, nextId]);
}

/** Error-spike cameo — fires when errors jump by 2+, with a frequency-scaled cooldown. */
export function useErrorSpikeCameo({ frequency, setCameo, nextId }: CameoOptions) {
  const errors = useEngineStore((s) => s.errors);
  const status = useEngineStore((s) => s.status);
  const prevErrors = useRef(0);
  const cooldownUntil = useRef(0);

  useEffect(() => {
    if (errors <= prevErrors.current) {
      prevErrors.current = errors;
      return;
    }
    const now = Date.now();
    const jumped = errors - prevErrors.current;
    prevErrors.current = errors;
    if (frequency === 'off') return;
    if (status !== 'running') return;
    if (jumped < 2) return;
    if (now < cooldownUntil.current) return;
    cooldownUntil.current = now + 12_000 * FREQUENCY_FACTOR[frequency];
    setCameo(buildCameo(nextId(), pickOne(ERROR_QUIPS), 3200));
  }, [errors, status, frequency, setCameo, nextId]);
}

/** Idle check-in — every ~20s of running typing, with a frequency-scaled gap. */
export function useIdleCameo({ current, frequency, setCameo, nextId }: CameoOptions) {
  const status = useEngineStore((s) => s.status);
  const lastCheckIn = useRef<number | null>(null);

  useEffect(() => {
    if (frequency === 'off') {
      lastCheckIn.current = null;
      return;
    }
    if (status !== 'running') {
      lastCheckIn.current = null;
      return;
    }
    if (lastCheckIn.current == null) lastCheckIn.current = Date.now();
    const minGap = 20_000 * FREQUENCY_FACTOR[frequency];
    const id = setInterval(() => {
      const since = Date.now() - (lastCheckIn.current ?? Date.now());
      if (since < minGap) return;
      if (current) return;
      lastCheckIn.current = Date.now();
      setCameo(buildCameo(nextId(), pickOne(IDLE_QUIPS), 3800));
    }, 3_000);
    return () => clearInterval(id);
  }, [status, current, frequency, setCameo, nextId]);
}
