import { useEffect, useRef, useState } from 'react';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { cn } from '@/lib/utils';
import { Raccoon } from './Raccoon';

type Side = 'left' | 'right' | 'bottom-left' | 'bottom-right';
type Mood = 'neutral' | 'judgy' | 'smug' | 'pleased' | 'shook';

interface Cameo {
  id: number;
  side: Side;
  mood: Mood;
  quip: string;
  duration: number;
}

/**
 * Drops a raccoon mascot in from a random edge at moments that
 * actually matter: run-completion, error spikes, and occasional idle
 * check-ins during a long stretch of typing. He stays for a few
 * seconds, delivers a line, and leaves.
 *
 * Designed to be dropped into any practice variant with no props —
 * pulls everything it needs from the engine store directly.
 */
export function RaccoonCameos() {
  const status = useEngineStore((s) => s.status);
  const errors = useEngineStore((s) => s.errors);
  const cursor = useEngineStore((s) => s.cursor);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);

  const [cameo, setCameo] = useState<Cameo | null>(null);
  const nextIdRef = useRef(0);
  const prevErrors = useRef(0);
  const prevStatus = useRef(status);
  const lastCheckInAt = useRef<number | null>(null);
  const errorStreakCooldown = useRef(0);

  // ---- trigger: greeting on mount --------------------------------
  useEffect(() => {
    const t = setTimeout(() => {
      setCameo(makeGreetingCameo(nextIdRef.current++));
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- trigger: finished -----------------------------------------
  useEffect(() => {
    if (prevStatus.current !== 'finished' && status === 'finished') {
      const elapsed = startedAt && finishedAt ? finishedAt - startedAt : 0;
      const wpm = computeWpm(charsCorrect, elapsed);
      const acc = computeAccuracy(charsCorrect, charsTyped);
      setCameo(makeFinishCameo(wpm, acc, nextIdRef.current++));
    }
    prevStatus.current = status;
  }, [status, startedAt, finishedAt, charsCorrect, charsTyped]);

  // ---- trigger: error spike --------------------------------------
  useEffect(() => {
    if (errors <= prevErrors.current) {
      prevErrors.current = errors;
      return;
    }
    const now = Date.now();
    const jumped = errors - prevErrors.current;
    prevErrors.current = errors;
    if (status !== 'running') return;
    if (jumped < 2) return; // a couple of misses in a row is enough
    if (now < errorStreakCooldown.current) return;
    errorStreakCooldown.current = now + 12_000;
    setCameo(makeErrorCameo(nextIdRef.current++));
  }, [errors, status]);

  // ---- trigger: idle check-in ------------------------------------
  useEffect(() => {
    if (status !== 'running') {
      lastCheckInAt.current = null;
      return;
    }
    if (lastCheckInAt.current == null) lastCheckInAt.current = Date.now();
    const id = setInterval(() => {
      const since = Date.now() - (lastCheckInAt.current ?? Date.now());
      if (since < 20_000) return;
      // don't pop in if a cameo is already showing or we just had one
      if (cameo) return;
      lastCheckInAt.current = Date.now();
      setCameo(makeIdleCameo(nextIdRef.current++));
    }, 3_000);
    return () => clearInterval(id);
  }, [status, cameo]);

  // reset on new passage
  useEffect(() => {
    if (cursor === 0 && charsTyped === 0) {
      setCameo(null);
      prevErrors.current = 0;
      errorStreakCooldown.current = 0;
      lastCheckInAt.current = null;
    }
  }, [cursor, charsTyped]);

  // auto-dismiss
  useEffect(() => {
    if (!cameo) return;
    const t = setTimeout(() => {
      setCameo((c) => (c?.id === cameo.id ? null : c));
    }, cameo.duration);
    return () => clearTimeout(t);
  }, [cameo]);

  if (!cameo) return null;
  return <CameoFrame cameo={cameo} onDismiss={() => setCameo(null)} />;
}

function CameoFrame({ cameo, onDismiss }: { cameo: Cameo; onDismiss: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // next tick — let CSS pick up the "hidden" state first so the
    // transition actually runs
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const { offset, peek } = edgeStyle(cameo.side, mounted);
  const bubbleSide = cameo.side.includes('right') ? 'left' : 'right';

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[60] transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1.2,0.36,1)]"
      style={{
        ...offset,
        transform: peek,
      }}
    >
      <div className="relative">
        {/* sits on a small drop shadow so he looks placed, not floating */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[88%] h-3 w-[70%] -translate-x-1/2 rounded-full blur-[6px]"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />

        <div className="relative raccoon-bob">
          <Raccoon mood={cameo.mood} size={130} />
        </div>

        {/* speech bubble */}
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            'pointer-events-auto absolute whitespace-nowrap rounded-2xl border border-black/10 bg-[#faf3e3] px-3 py-1.5 text-[13px] font-medium italic text-[#2a1f12] shadow-[0_6px_16px_-6px_rgba(0,0,0,0.5)]',
            bubbleSide === 'left' ? '-left-2 translate-x-[-100%]' : '-right-2 translate-x-[100%]',
          )}
          style={{
            top: 24,
          }}
        >
          {cameo.quip}
          <span
            aria-hidden
            className={cn('absolute top-3 h-3 w-3 rotate-45 bg-[#faf3e3]', bubbleSide === 'left' ? '-right-1.5' : '-left-1.5')}
            style={{
              borderRight: bubbleSide === 'left' ? '1px solid rgba(0,0,0,0.1)' : undefined,
              borderTop: bubbleSide === 'left' ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(0,0,0,0.1)',
              borderLeft: bubbleSide === 'right' ? '1px solid rgba(0,0,0,0.1)' : undefined,
              borderBottom: bubbleSide === 'right' ? '1px solid rgba(0,0,0,0.1)' : undefined,
            }}
          />
        </button>
      </div>
    </div>
  );
}

function edgeStyle(side: Side, mounted: boolean): { offset: React.CSSProperties; peek: string } {
  switch (side) {
    case 'left':
      return {
        offset: { left: 0, top: '55%' },
        peek: mounted ? 'translateX(-14%) translateY(-50%)' : 'translateX(-110%) translateY(-50%)',
      };
    case 'right':
      return {
        offset: { right: 0, top: '55%' },
        peek: mounted ? 'translateX(14%) translateY(-50%)' : 'translateX(110%) translateY(-50%)',
      };
    case 'bottom-left':
      return {
        offset: { left: '8%', bottom: 0 },
        peek: mounted ? 'translateY(28%)' : 'translateY(130%)',
      };
    case 'bottom-right':
      return {
        offset: { right: '8%', bottom: 0 },
        peek: mounted ? 'translateY(28%)' : 'translateY(130%)',
      };
  }
}

function pickSide(): Side {
  const sides: Side[] = ['left', 'right', 'bottom-left', 'bottom-right'];
  return sides[Math.floor(Math.random() * sides.length)];
}
function pickOne<T>(xs: T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

// ---- copy banks ---------------------------------------------------

const GREETING_QUIPS: Array<{ mood: Mood; text: string }> = [
  { mood: 'neutral', text: "oh. it's you." },
  { mood: 'smug', text: 'back for more?' },
  { mood: 'neutral', text: 'whenever you\'re ready.' },
  { mood: 'judgy', text: "let's see what you've got." },
];

function makeGreetingCameo(id: number): Cameo {
  const q = pickOne(GREETING_QUIPS);
  return { id, side: pickSide(), mood: q.mood, quip: q.text, duration: 3600 };
}

const IDLE_QUIPS: Array<{ mood: Mood; text: string }> = [
  { mood: 'neutral', text: "still here. don't mind me." },
  { mood: 'judgy', text: "that's a word, technically." },
  { mood: 'smug', text: 'pacing yourself. bold.' },
  { mood: 'neutral', text: 'keep going. or don\'t.' },
  { mood: 'smug', text: "i've seen faster. allegedly." },
];

const ERROR_QUIPS: Array<{ mood: Mood; text: string }> = [
  { mood: 'judgy', text: 'hmm.' },
  { mood: 'shook', text: 'what was that.' },
  { mood: 'judgy', text: 'try reading first.' },
  { mood: 'smug', text: 'interesting choice.' },
];

function makeIdleCameo(id: number): Cameo {
  const q = pickOne(IDLE_QUIPS);
  return { id, side: pickSide(), mood: q.mood, quip: q.text, duration: 3800 };
}

function makeErrorCameo(id: number): Cameo {
  const q = pickOne(ERROR_QUIPS);
  return { id, side: pickSide(), mood: q.mood, quip: q.text, duration: 3200 };
}

function makeFinishCameo(wpm: number, acc: number, id: number): Cameo {
  const base = { id, side: pickSide(), duration: 6500 };
  if (acc < 0.85) {
    return { ...base, mood: 'judgy', quip: 'a bold interpretation.' };
  }
  if (wpm >= 80 && acc > 0.97) {
    return { ...base, mood: 'pleased', quip: 'okay okay okay. show-off.' };
  }
  if (wpm >= 60 && acc > 0.95) {
    return { ...base, mood: 'pleased', quip: "fine. that was fine. don't gloat." };
  }
  if (wpm < 30) {
    return { ...base, mood: 'smug', quip: 'we got there. eventually.' };
  }
  return { ...base, mood: 'neutral', quip: "acceptable. i'll allow it." };
}

// ---- side-effect: ship the bob keyframe ---------------------------
// keep the animation local to this component bundle so we don't have
// to touch globals.css for every one-off mascot flourish
if (typeof document !== 'undefined') {
  const id = 'raccoon-cameo-styles';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `
      @keyframes raccoon-bob {
        0%,100% { transform: translateY(0) rotate(-1deg); }
        50% { transform: translateY(-4px) rotate(2deg); }
      }
      .raccoon-bob { animation: raccoon-bob 2.8s ease-in-out infinite; transform-origin: 50% 80%; }
    `;
    document.head.appendChild(s);
  }
}

