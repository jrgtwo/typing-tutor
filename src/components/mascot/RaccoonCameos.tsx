import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from '@/lib/auth';
import { useProfile, type RaccoonFrequency } from '@/lib/queries';
import { cn } from '@/lib/utils';
import { Raccoon } from './Raccoon';
import {
  useErrorSpikeCameo,
  useFinishCameo,
  useGreetingCameo,
  useIdleCameo,
  type Cameo,
  type Side,
} from './triggers';

/**
 * Drops a raccoon mascot in from a random edge at moments that
 * actually matter: run-completion, error spikes, and occasional idle
 * check-ins during a long stretch of typing. Pulls everything it
 * needs from the engine store and the user's preferences.
 */
export function RaccoonCameos() {
  const { session } = useSession();
  const profileQuery = useProfile(Boolean(session));
  const frequency: RaccoonFrequency =
    profileQuery.data?.preferences.raccoonFrequency ?? 'normal';

  const [cameo, setCameo] = useState<Cameo | null>(null);
  const nextIdRef = useRef(0);
  const nextId = useCallback(() => nextIdRef.current++, []);
  const set = useCallback((c: Cameo) => setCameo(c), []);

  const opts = { current: cameo, setCameo: set, nextId, frequency };

  useGreetingCameo(opts);
  useFinishCameo(opts);
  useErrorSpikeCameo(opts);
  useIdleCameo(opts);

  // Note: we used to clear cameos on engine reset (cursor=0, charsTyped=0),
  // but that killed them on every Race the Clock auto-refill and even on
  // initial mount before the greeting could show. Cameos auto-dismiss via
  // their `duration` (effect below); a brief carry-over into the next
  // passage is fine, and saves us from heuristics about *why* the engine
  // just reset.

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
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[88%] h-3 w-[70%] -translate-x-1/2 rounded-full blur-[6px]"
          style={{ background: 'rgba(0,0,0,0.45)' }}
        />

        <div className="relative raccoon-bob">
          <Raccoon mood={cameo.mood} size={130} />
        </div>

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
