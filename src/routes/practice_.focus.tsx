import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useCaretScroll } from '@/hooks/useCaretScroll';
import { DesignNav } from '@/components/DesignNav';
import { RaccoonCameos } from '@/components/mascot/RaccoonCameos';
import { OnScreenKeyboard } from '@/components/typing/OnScreenKeyboard';
import { cn } from '@/lib/utils';

const FOCUS_KBD: React.CSSProperties = {
  ['--color-paper' as any]: '#0f1524',
  ['--color-paper-deep' as any]: '#1b2340',
  ['--color-ink' as any]: '#ffffff',
  ['--color-ink-soft' as any]: '#a8b6d9',
  ['--color-amber' as any]: '#b4cbff',
  ['--color-phosphor' as any]: '#b4cbff',
  ['--color-phosphor-dim' as any]: '#d8e0f0',
  ['--color-rust' as any]: '#ff8da1',
};

export const Route = createFileRoute('/practice_/focus')({
  component: FocusPractice,
});

/**
 * Zen / focus: a single floating column of text over a deep indigo void
 * with a soft bloom behind the cursor. HUD and passage picker collapse
 * into near-invisible edges until you hover.
 */
function FocusPractice() {
  const { passage, passages, index, pickPassage, next, reset } = usePracticeSession();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0f1a] text-[#d8e0f0]">
      <DesignNav />
      <RaccoonCameos />
      {/* ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 55%, rgba(127,170,255,0.18), transparent 70%), radial-gradient(ellipse 30% 20% at 20% 20%, rgba(200,140,255,0.08), transparent 70%)',
        }}
      />

      {/* top nav collapses */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-8 py-6 opacity-30 transition-opacity duration-300 hover:opacity-100">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#d8e0f0]/70 hover:text-[#d8e0f0]">
          ← exit
        </Link>
        <FocusHud />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-8 pb-28 pt-24">
        <p className="mb-6 text-center font-serif text-sm italic text-[#d8e0f0]/35">
          {passage.title}{passage.source && ` — ${passage.source}`}
        </p>
        <FocusSurface />
        <FocusFooter onNext={next} onReset={reset} />

        <div className="mt-12 opacity-60 transition-opacity duration-500 hover:opacity-100" style={FOCUS_KBD}>
          <OnScreenKeyboard />
        </div>
      </section>

      {/* passage picker — collapsed strip at the bottom */}
      <div className="group absolute inset-x-0 bottom-0 z-10 flex justify-center pb-6">
        <div className="flex gap-1 rounded-full border border-[#d8e0f0]/10 bg-[#0b0f1a]/60 p-1 backdrop-blur-sm">
          {passages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pickPassage(i)}
              title={p.title}
              aria-label={p.title}
              className={cn(
                'h-2 w-6 rounded-full transition-all',
                i === index
                  ? 'bg-[#b4cbff] w-10'
                  : 'bg-[#d8e0f0]/20 hover:bg-[#d8e0f0]/40',
              )}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function FocusHud() {
  const status = useEngineStore((s) => s.status);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [status]);

  const end = status === 'finished' ? (finishedAt ?? now) : now;
  const elapsed = startedAt ? Math.max(0, end - startedAt) : 0;
  const wpm = computeWpm(charsCorrect, elapsed);
  const acc = computeAccuracy(charsCorrect, charsTyped);

  return (
    <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.4em] text-[#d8e0f0]/50">
      <span>{wpm.toFixed(0)} wpm</span>
      <span>{(acc * 100).toFixed(0)}%</span>
      <span>{fmt(elapsed)}</span>
    </div>
  );
}

function FocusSurface() {
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const status = useEngineStore((s) => s.status);
  const caretRef = useCaretScroll();

  return (
    <div className="h-[300px] overflow-y-auto whitespace-pre-wrap break-words text-center font-serif text-[30px] leading-[1.6] tracking-wide">
      {Array.from(target).map((ch, i) => {
        const past = i < cursor;
        const current = i === cursor && status !== 'finished';
        const ok = past && typed[i] === ch;

        if (current) {
          return (
            <span
              key={i}
              ref={caretRef}
              className="relative text-[#ffffff]"
              style={{
                textShadow: '0 0 18px rgba(180,203,255,0.9), 0 0 36px rgba(180,203,255,0.5)',
              }}
            >
              <span className="caret-blink">{ch === '\n' ? '\n' : ch}</span>
            </span>
          );
        }
        if (past && ok) {
          return (
            <span
              key={i}
              className="text-[#d8e0f0]"
              style={{ textShadow: '0 0 6px rgba(180,203,255,0.2)' }}
            >
              {ch}
            </span>
          );
        }
        if (past && !ok) {
          return (
            <span key={i} className="text-[#ff8da1]" style={{ textShadow: '0 0 10px rgba(255,141,161,0.5)' }}>
              {ch === ' ' ? '·' : ch}
            </span>
          );
        }
        return <span key={i} className="text-[#d8e0f0]/20">{ch}</span>;
      })}
    </div>
  );
}

function FocusFooter({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') {
    return (
      <p className="mt-10 text-center font-serif text-sm italic text-[#d8e0f0]/30">
        breathe · begin.
      </p>
    );
  }
  return (
    <div className="mt-10 flex justify-center gap-6 font-mono text-[11px] uppercase tracking-[0.4em]">
      <button
        type="button"
        onClick={onReset}
        className="text-[#d8e0f0]/60 underline underline-offset-8 hover:text-[#d8e0f0]"
      >
        again
      </button>
      <button
        type="button"
        onClick={onNext}
        className="text-[#b4cbff] underline underline-offset-8 hover:text-[#d8e0f0]"
      >
        next →
      </button>
    </div>
  );
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
