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
  { mood: 'neutral', text: "whenever you're ready." },
  { mood: 'judgy', text: "let's see what you've got." },
  { mood: 'smug', text: "couldn't stay away, huh." },
  { mood: 'neutral', text: 'fingers warm? good.' },
  { mood: 'judgy', text: 'no warmup today?' },
  { mood: 'pleased', text: 'ah. a challenger.' },
  { mood: 'neutral', text: "try not to embarrass us." },
  { mood: 'smug', text: "i've been waiting." },
  { mood: 'judgy', text: 'posture. think about it.' },
  { mood: 'neutral', text: 'clock starts when you do.' },
  { mood: 'shook', text: 'oh — already? okay.' },
  { mood: 'smug', text: "let's not waste my time." },
  { mood: 'neutral', text: 'home row. find it.' },
  { mood: 'judgy', text: 'wrists. lift them.' },
  { mood: 'smug', text: "look who's procrastinating productively." },
  { mood: 'neutral', text: "i'll be over here. judging silently." },
  { mood: 'judgy', text: 'caps lock check. i mean it.' },
  { mood: 'pleased', text: 'fresh keyboard energy. love it.' },
  { mood: 'shook', text: 'you came back. wild.' },
  { mood: 'smug', text: 'another round. brave of you.' },
  { mood: 'neutral', text: 'pick a pace. commit to it.' },
  { mood: 'judgy', text: 'thumbs on the spacebar. only.' },
  { mood: 'neutral', text: 'show me something.' },
  { mood: 'smug', text: 'hope you stretched.' },
  { mood: 'judgy', text: "we're not hunting and pecking today." },
  { mood: 'pleased', text: "okay. let's cook." },
  { mood: 'neutral', text: 'screen brightness ok? cool.' },
  { mood: 'smug', text: 'last time was rough. fresh start.' },
];

function makeGreetingCameo(id: number): Cameo {
  const q = pickOne(GREETING_QUIPS);
  return { id, side: pickSide(), mood: q.mood, quip: q.text, duration: 3600 };
}

const IDLE_QUIPS: Array<{ mood: Mood; text: string }> = [
  { mood: 'neutral', text: "still here. don't mind me." },
  { mood: 'judgy', text: "that's a word, technically." },
  { mood: 'smug', text: 'pacing yourself. bold.' },
  { mood: 'neutral', text: "keep going. or don't." },
  { mood: 'smug', text: "i've seen faster. allegedly." },
  { mood: 'judgy', text: 'are we typing or napping?' },
  { mood: 'neutral', text: 'breathe. then keep going.' },
  { mood: 'smug', text: 'cute pace.' },
  { mood: 'judgy', text: "that key's not haunted." },
  { mood: 'neutral', text: 'you got this. probably.' },
  { mood: 'smug', text: 'taking the scenic route, i see.' },
  { mood: 'shook', text: "oh you're still going. good." },
  { mood: 'judgy', text: 'spelling is a suggestion now?' },
  { mood: 'neutral', text: 'eyes up. words go forward.' },
  { mood: 'smug', text: "this is a marathon for you, isn't it." },
  { mood: 'pleased', text: 'rhythm. nice.' },
  { mood: 'judgy', text: 'less staring, more typing.' },
  { mood: 'neutral', text: 'one word at a time.' },
  { mood: 'smug', text: 'glaciers move faster. but go off.' },
  { mood: 'judgy', text: 'the cursor is blinking. at you.' },
  { mood: 'neutral', text: "don't think. just type." },
  { mood: 'shook', text: 'is something wrong?' },
  { mood: 'smug', text: 'savoring it, are we.' },
  { mood: 'pleased', text: "okay you're in the zone. nice." },
  { mood: 'judgy', text: 'left hand. it has fingers too.' },
  { mood: 'neutral', text: "second wind's right around the corner." },
  { mood: 'smug', text: "i'm not bored. you're bored." },
  { mood: 'judgy', text: 'we lost the rhythm. find it.' },
  { mood: 'neutral', text: 'just words. they can\'t hurt you.' },
  { mood: 'shook', text: 'oh. i thought you stopped.' },
  { mood: 'smug', text: "i'll wait. i have nothing else." },
  { mood: 'judgy', text: 'fingers, not knuckles.' },
  { mood: 'pleased', text: 'flow state? almost?' },
  { mood: 'neutral', text: "don't overthink the next one." },
];

const ERROR_QUIPS: Array<{ mood: Mood; text: string }> = [
  { mood: 'judgy', text: 'hmm.' },
  { mood: 'shook', text: 'what was that.' },
  { mood: 'judgy', text: 'try reading first.' },
  { mood: 'smug', text: 'interesting choice.' },
  { mood: 'shook', text: 'oof.' },
  { mood: 'judgy', text: 'on purpose?' },
  { mood: 'smug', text: 'collecting typos for fun?' },
  { mood: 'judgy', text: 'slow down, champ.' },
  { mood: 'shook', text: 'ow. my eyes.' },
  { mood: 'smug', text: 'creative spelling.' },
  { mood: 'judgy', text: "the keys haven't moved." },
  { mood: 'shook', text: 'wait what.' },
  { mood: 'judgy', text: 'reset. focus.' },
  { mood: 'smug', text: "keep going, i'm taking notes." },
  { mood: 'judgy', text: 'breathe through it.' },
  { mood: 'shook', text: 'rude.' },
  { mood: 'judgy', text: 'that letter exists. you just missed it.' },
  { mood: 'smug', text: 'avant-garde typing. interesting.' },
  { mood: 'shook', text: 'did the keyboard move?' },
  { mood: 'judgy', text: 'shift. it does things.' },
  { mood: 'smug', text: 'a bold misspelling.' },
  { mood: 'judgy', text: 'less caffeine. or more. one of those.' },
  { mood: 'shook', text: 'physically painful.' },
  { mood: 'smug', text: "you're freestyling now." },
  { mood: 'judgy', text: 'the prompt. read it. again.' },
  { mood: 'shook', text: 'how.' },
  { mood: 'judgy', text: 'fingers crossed? uncross them.' },
  { mood: 'smug', text: 'a personal touch.' },
  { mood: 'judgy', text: 'this is a typing app. not jazz.' },
  { mood: 'shook', text: 'okay okay okay. recover.' },
  { mood: 'smug', text: 'redefining the language.' },
  { mood: 'judgy', text: 'eyes on the words. not the keys.' },
];

function makeIdleCameo(id: number): Cameo {
  const q = pickOne(IDLE_QUIPS);
  return { id, side: pickSide(), mood: q.mood, quip: q.text, duration: 3800 };
}

function makeErrorCameo(id: number): Cameo {
  const q = pickOne(ERROR_QUIPS);
  return { id, side: pickSide(), mood: q.mood, quip: q.text, duration: 3200 };
}

const FINISH_SLOPPY: Array<{ mood: Mood; text: string }> = [
  { mood: 'judgy', text: 'a bold interpretation.' },
  { mood: 'judgy', text: 'spelling is a suggestion, apparently.' },
  { mood: 'smug', text: 'avant-garde. confusing. but avant-garde.' },
  { mood: 'judgy', text: 'accuracy is a virtue. allegedly.' },
  { mood: 'shook', text: 'the words. they had a shape.' },
];

const FINISH_BLAZING: Array<{ mood: Mood; text: string }> = [
  { mood: 'pleased', text: 'okay okay okay. show-off.' },
  { mood: 'pleased', text: 'fingers like little hammers. concerning.' },
  { mood: 'shook', text: 'who hurt you. and how fast.' },
  { mood: 'pleased', text: 'absurd. i love it. tell no one.' },
  { mood: 'smug', text: 'fine. you may brag. once.' },
];

const FINISH_FAST: Array<{ mood: Mood; text: string }> = [
  { mood: 'pleased', text: "fine. that was fine. don't gloat." },
  { mood: 'pleased', text: 'crisp. unsettlingly crisp.' },
  { mood: 'neutral', text: 'respectable. moving on.' },
  { mood: 'smug', text: "i'll mark you down as competent." },
  { mood: 'pleased', text: 'decent hands. decent brain. decent.' },
];

const FINISH_MID: Array<{ mood: Mood; text: string }> = [
  { mood: 'neutral', text: "acceptable. i'll allow it." },
  { mood: 'neutral', text: 'serviceable. like a hotel pen.' },
  { mood: 'smug', text: "not bad. not great. not nothing." },
  { mood: 'judgy', text: 'middle of the road. literally.' },
  { mood: 'neutral', text: 'a passing grade. barely sparkling.' },
  { mood: 'smug', text: 'adequate. the highest praise i give.' },
];

const FINISH_SLOW: Array<{ mood: Mood; text: string }> = [
  { mood: 'smug', text: 'we got there. eventually.' },
  { mood: 'judgy', text: 'a leisurely stroll through the alphabet.' },
  { mood: 'smug', text: 'no notes. except: faster.' },
  { mood: 'judgy', text: 'turtles texted. they want their pace back.' },
  { mood: 'neutral', text: 'savored every keystroke, did we.' },
  { mood: 'smug', text: 'unhurried. like a tax audit.' },
];

const FINISH_GLACIAL: Array<{ mood: Mood; text: string }> = [
  { mood: 'judgy', text: 'glaciers finished sooner.' },
  { mood: 'smug', text: 'a meditation, really. on time.' },
  { mood: 'shook', text: 'are the keys okay?' },
  { mood: 'judgy', text: 'i made a sandwich. i ate the sandwich.' },
];

function makeFinishCameo(wpm: number, acc: number, id: number): Cameo {
  const base = { id, side: pickSide(), duration: 6500 };
  let pool: Array<{ mood: Mood; text: string }>;
  if (acc < 0.85) pool = FINISH_SLOPPY;
  else if (wpm >= 80 && acc > 0.97) pool = FINISH_BLAZING;
  else if (wpm >= 60 && acc > 0.95) pool = FINISH_FAST;
  else if (wpm < 15) pool = FINISH_GLACIAL;
  else if (wpm < 30) pool = FINISH_SLOW;
  else pool = FINISH_MID;
  const q = pickOne(pool);
  return { ...base, mood: q.mood, quip: q.text };
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

