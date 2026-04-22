import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { DesignNav } from '@/components/DesignNav';
import { OnScreenKeyboard } from '@/components/typing/OnScreenKeyboard';
import { cn } from '@/lib/utils';

const ARCADE_KBD: React.CSSProperties = {
  ['--color-paper' as any]: '#05000e',
  ['--color-paper-deep' as any]: '#3a1055',
  ['--color-ink' as any]: '#ffffff',
  ['--color-ink-soft' as any]: '#7cf3ff',
  ['--color-amber' as any]: '#ffd94a',
  ['--color-phosphor' as any]: '#ff5ad4',
  ['--color-phosphor-dim' as any]: '#ff9fe3',
  ['--color-rust' as any]: '#ff5ad4',
};

export const Route = createFileRoute('/practice_/arcade')({
  component: ArcadePractice,
});

/**
 * Neon arcade: a late-80s attract screen. Magenta + cyan on plum-black,
 * scanlines, glowing scoreboard. The keyboard turns into a DDR-style
 * light grid.
 */
function ArcadePractice() {
  const { passage, passages, index, pickPassage, next, reset } = usePracticeSession();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0014] text-[#e6e6ff]">
      <DesignNav />
      <Grid />
      <Scanlines />

      <div className="relative mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#ff5ad4] hover:text-[#ff9fe3]"
            style={{ textShadow: '0 0 10px rgba(255,90,212,0.8)' }}
          >
            ◂◂ exit
          </Link>
          <div
            className="font-mono text-xs uppercase tracking-[0.6em] text-[#7cf3ff]"
            style={{ textShadow: '0 0 10px rgba(124,243,255,0.8)' }}
          >
            ▸ {passage.modeId} ▸ {passage.id}
          </div>
        </div>

        <h1
          className="mt-6 text-center font-mono text-5xl font-black uppercase tracking-[0.2em] text-[#ff5ad4] md:text-7xl"
          style={{
            textShadow:
              '0 0 10px rgba(255,90,212,0.9), 0 0 30px rgba(255,90,212,0.6), 0 0 60px rgba(255,90,212,0.3)',
          }}
        >
          {passage.title}
        </h1>

        <Scoreboard />

        <div
          className="mt-8 rounded border-2 border-[#7cf3ff]/60 bg-[#05000e]/80 p-8 backdrop-blur-[2px]"
          style={{ boxShadow: '0 0 0 1px rgba(124,243,255,0.3), 0 0 40px rgba(124,243,255,0.2), inset 0 0 60px rgba(124,243,255,0.06)' }}
        >
          <ArcadeSurface />
        </div>

        <ArcadeFooter onNext={next} onReset={reset} />

        <div
          className="relative z-20 mt-10 rounded border-2 border-[#7cf3ff]/50 bg-[#05000e]/70 p-4"
          style={{
            ...ARCADE_KBD,
            boxShadow: '0 0 20px rgba(124,243,255,0.25), inset 0 0 30px rgba(124,243,255,0.06)',
          }}
        >
          <OnScreenKeyboard />
        </div>

        <div className="mt-12">
          <p
            className="mb-3 text-center font-mono text-[11px] uppercase tracking-[0.5em] text-[#ff5ad4]/80"
            style={{ textShadow: '0 0 8px rgba(255,90,212,0.6)' }}
          >
            ▸ select stage ◂
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {passages.map((p, i) => {
              const active = i === index;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPassage(i)}
                  className={cn(
                    'rounded border-2 p-3 text-center font-mono text-xs uppercase tracking-widest transition-all',
                    active
                      ? 'border-[#ffd94a] text-[#ffd94a]'
                      : 'border-[#7cf3ff]/40 text-[#7cf3ff]/80 hover:border-[#7cf3ff] hover:text-[#7cf3ff]',
                  )}
                  style={
                    active
                      ? {
                          boxShadow:
                            '0 0 15px rgba(255,217,74,0.6), inset 0 0 15px rgba(255,217,74,0.15)',
                          textShadow: '0 0 10px rgba(255,217,74,0.9)',
                        }
                      : undefined
                  }
                >
                  <span className="block text-[9px] opacity-60">stage {String(i + 1).padStart(2, '0')}</span>
                  <span className="mt-1 block font-bold">{p.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function Grid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          'linear-gradient(rgba(255,90,212,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(124,243,255,0.15) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage:
          'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%)',
      }}
    />
  );
}

function Scanlines() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        background:
          'repeating-linear-gradient(to bottom, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)',
      }}
    />
  );
}

function Scoreboard() {
  const status = useEngineStore((s) => s.status);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [status]);

  const end = status === 'finished' ? (finishedAt ?? now) : now;
  const elapsed = startedAt ? Math.max(0, end - startedAt) : 0;
  const wpm = computeWpm(charsCorrect, elapsed);
  const acc = computeAccuracy(charsCorrect, charsTyped);
  const score = Math.round(charsCorrect * 10 - errors * 25);

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
      <Cell label="1UP WPM" value={String(Math.round(wpm)).padStart(3, '0')} color="#7cf3ff" />
      <Cell label="ACC" value={`${(acc * 100).toFixed(0)}%`} color="#ffd94a" />
      <Cell label="HIT" value={String(charsCorrect).padStart(4, '0')} color="#7cff9e" />
      <Cell label="SCORE" value={String(Math.max(0, score)).padStart(6, '0')} color="#ff5ad4" accent />
    </div>
  );
}

function Cell({ label, value, color, accent }: { label: string; value: string; color: string; accent?: boolean }) {
  return (
    <div
      className="rounded border-2 bg-[#05000e]/70 px-4 py-3 text-center"
      style={{
        borderColor: `${color}66`,
        boxShadow: `0 0 15px ${color}33, inset 0 0 15px ${color}14`,
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.4em]" style={{ color: `${color}cc` }}>
        {label}
      </p>
      <p
        className={cn('mt-1 font-mono font-black tabular-nums', accent ? 'text-3xl' : 'text-2xl')}
        style={{ color, textShadow: `0 0 12px ${color}cc` }}
      >
        {value}
      </p>
    </div>
  );
}

function ArcadeSurface() {
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const status = useEngineStore((s) => s.status);

  return (
    <div className="whitespace-pre-wrap break-words font-mono text-[22px] leading-[1.6] tracking-wide">
      {Array.from(target).map((ch, i) => {
        const past = i < cursor;
        const current = i === cursor && status !== 'finished';
        const ok = past && typed[i] === ch;

        if (current) {
          return (
            <span
              key={i}
              className="caret-blink text-[#ffd94a]"
              style={{
                background: 'rgba(255,217,74,0.25)',
                textShadow: '0 0 12px rgba(255,217,74,1)',
                boxShadow: '0 0 12px rgba(255,217,74,0.6)',
              }}
            >
              {ch === '\n' ? '▼\n' : ch}
            </span>
          );
        }
        if (past && ok) {
          return (
            <span key={i} className="text-[#7cf3ff]" style={{ textShadow: '0 0 6px rgba(124,243,255,0.8)' }}>
              {ch}
            </span>
          );
        }
        if (past && !ok) {
          return (
            <span
              key={i}
              className="text-[#ff5ad4]"
              style={{
                textShadow: '0 0 10px rgba(255,90,212,1)',
                background: 'rgba(255,90,212,0.18)',
              }}
            >
              {ch === ' ' ? '✕' : ch}
            </span>
          );
        }
        return <span key={i} className="text-[#e6e6ff]/25">{ch}</span>;
      })}
    </div>
  );
}

function ArcadeFooter({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') {
    return (
      <p
        className="mt-6 text-center font-mono text-xs uppercase tracking-[0.5em] text-[#ffd94a] caret-blink"
        style={{ textShadow: '0 0 8px rgba(255,217,74,0.8)' }}
      >
        ▸ press any key to play ◂
      </p>
    );
  }
  return (
    <div className="mt-6 flex justify-center gap-4">
      <button
        type="button"
        onClick={onReset}
        className="rounded border-2 border-[#7cf3ff] px-6 py-2 font-mono text-xs uppercase tracking-[0.4em] text-[#7cf3ff] hover:bg-[#7cf3ff]/10"
        style={{ boxShadow: '0 0 15px rgba(124,243,255,0.5)', textShadow: '0 0 8px rgba(124,243,255,0.8)' }}
      >
        Continue?
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded border-2 border-[#ff5ad4] bg-[#ff5ad4]/10 px-6 py-2 font-mono text-xs uppercase tracking-[0.4em] text-[#ff9fe3] hover:bg-[#ff5ad4]/20"
        style={{ boxShadow: '0 0 20px rgba(255,90,212,0.7)', textShadow: '0 0 10px rgba(255,90,212,0.9)' }}
      >
        Next stage ▸
      </button>
    </div>
  );
}
