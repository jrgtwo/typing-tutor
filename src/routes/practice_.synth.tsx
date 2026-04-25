import { createFileRoute, Link } from '@tanstack/react-router';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useEngineElapsedMs } from '@/hooks/useEngineElapsedMs';
import { useCaretScroll } from '@/hooks/useCaretScroll';
import { DesignNav } from '@/components/DesignNav';
import { RaccoonCameos } from '@/components/mascot/RaccoonCameos';
import { OnScreenKeyboard } from '@/components/typing/OnScreenKeyboard';
import { BetweenSessionsAd } from '@/components/ads/BetweenSessionsAd';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/practice_/synth')({
  component: SynthPractice,
});

const SYNTH_KBD: React.CSSProperties = {
  ['--color-paper' as any]: '#0a031a',
  ['--color-paper-deep' as any]: '#2b1058',
  ['--color-ink' as any]: '#f3e9ff',
  ['--color-ink-soft' as any]: '#a58cff',
  ['--color-amber' as any]: '#ffe17a',
  ['--color-phosphor' as any]: '#ff5ad4',
  ['--color-phosphor-dim' as any]: '#ffbde8',
  ['--color-rust' as any]: '#ff4d6d',
};

/**
 * synth: terminal layout bones under a retrowave wrapper. Raised card
 * with a chunky magenta bezel, side equalizer bars that breathe with
 * WPM, sun-over-grid horizon up top.
 */
function SynthPractice() {
  const { passage, passages, index, pickPassage, next, reset } = usePracticeSession();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06021a] text-[#f3e9ff]">
      <DesignNav />
      <RaccoonCameos />

      {/* horizon sun */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[60vh]"
        style={{
          background:
            'radial-gradient(ellipse 50% 90% at 50% 80%, rgba(255,90,212,0.4), transparent 70%), linear-gradient(to bottom, #1b0548 0%, #06021a 80%)',
        }}
      />
      {/* floor grid */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[60vh]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(124,243,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,90,212,0.25) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom',
          maskImage: 'linear-gradient(to top, black 0%, transparent 85%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 85%)',
        }}
      />
      {/* scanlines */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            'repeating-linear-gradient(to bottom, rgba(255,255,255,0.035) 0, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <header className="flex items-center justify-between border-b border-[#ff5ad4]/40 pb-3 text-[11px] uppercase tracking-[0.35em]">
          <Link
            to="/"
            className="text-[#7cf3ff] hover:text-white"
            style={{ textShadow: '0 0 8px rgba(124,243,255,0.8)' }}
          >
            ◂ eject
          </Link>
          <div className="flex items-center gap-5">
            <span className="text-[#ffbde8]/80">
              side.a · <span className="text-[#ff5ad4]" style={{ textShadow: '0 0 8px rgba(255,90,212,0.8)' }}>{passage.id}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[#7cf3ff]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5ad4] caret-blink" style={{ boxShadow: '0 0 8px rgba(255,90,212,0.9)' }} />
              rec
            </span>
          </div>
        </header>

        <h1
          className="mt-5 text-center font-mono text-4xl font-black uppercase italic tracking-[0.15em] md:text-6xl"
          style={{
            color: '#ff5ad4',
            textShadow:
              '0 0 12px rgba(255,90,212,0.9), 0 0 30px rgba(255,90,212,0.5), 4px 4px 0 rgba(124,243,255,0.35)',
          }}
        >
          {passage.title}
        </h1>

        <SynthScoreboard />

        {/* raised hero */}
        <section className="relative mx-auto mt-8 grid grid-cols-1 gap-4 md:grid-cols-[64px_1fr_64px]">
          <EqBars side="left" />

          <div className="relative">
            {/* under-glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-8 -bottom-6 h-16 blur-3xl"
              style={{ background: 'radial-gradient(ellipse at center, rgba(255,90,212,0.55), transparent 70%)' }}
            />
            <div
              className="relative rounded-[12px] bg-[#0a0223]/95 p-8"
              style={{
                border: '2px solid #ff5ad4',
                boxShadow:
                  '0 0 0 1px rgba(124,243,255,0.45), 0 0 40px rgba(255,90,212,0.45), inset 0 0 60px rgba(124,243,255,0.08), 0 6px 0 rgba(43,16,88,0.9), 0 14px 0 rgba(20,6,50,0.9), 0 28px 40px -18px rgba(0,0,0,0.9)',
              }}
            >
              <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-[#7cf3ff]">
                <span style={{ textShadow: '0 0 6px rgba(124,243,255,0.8)' }}>▸ deck_a</span>
                <span className="text-[#ffe17a]" style={{ textShadow: '0 0 6px rgba(255,225,122,0.8)' }}>
                  120 bpm · 33⅓
                </span>
              </div>
              <SynthSurface />
            </div>
          </div>

          <EqBars side="right" />
        </section>

        <SynthFooter onNext={next} onReset={reset} />

        <BetweenSessionsAd />

        <section className="mt-10">
          <p
            className="mb-2 text-[10px] uppercase tracking-[0.4em] text-[#7cf3ff]"
            style={{ textShadow: '0 0 6px rgba(124,243,255,0.7)' }}
          >
            ▸ tracklist
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {passages.map((p, i) => {
              const active = i === index;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPassage(i)}
                  className={cn(
                    'rounded border-2 px-3 py-2 text-left text-xs uppercase tracking-widest transition-all',
                    active
                      ? 'border-[#ffe17a] text-[#ffe17a]'
                      : 'border-[#ff5ad4]/40 text-[#f3e9ff]/80 hover:border-[#7cf3ff] hover:text-[#7cf3ff]',
                  )}
                  style={
                    active
                      ? {
                          boxShadow: '0 0 14px rgba(255,225,122,0.55), inset 0 0 12px rgba(255,225,122,0.12)',
                          textShadow: '0 0 10px rgba(255,225,122,0.9)',
                        }
                      : undefined
                  }
                >
                  <span className="block text-[9px] opacity-60">trk·{String(i + 1).padStart(2, '0')}</span>
                  <span className="mt-0.5 block font-bold">{p.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div
          className="mt-6 rounded border-2 border-[#ff5ad4]/50 bg-[#0a0223]/80 p-3"
          style={{ boxShadow: '0 0 20px rgba(255,90,212,0.2)', ...SYNTH_KBD }}
        >
          <p className="mb-2 text-[10px] uppercase tracking-[0.4em] text-[#ff5ad4]" style={{ textShadow: '0 0 6px rgba(255,90,212,0.8)' }}>
            ▸ mpc pad
          </p>
          <OnScreenKeyboard />
        </div>
      </div>
    </main>
  );
}

function SynthSurface() {
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const status = useEngineStore((s) => s.status);
  const caretRef = useCaretScroll();

  return (
    <div className="h-[260px] overflow-y-auto whitespace-pre-wrap break-words font-mono text-[22px] leading-[1.6] tracking-wide">
      {Array.from(target).map((ch, i) => {
        const past = i < cursor;
        const current = i === cursor && status !== 'finished';
        const ok = past && typed[i] === ch;

        if (current) {
          return (
            <span
              key={i}
              ref={caretRef}
              className="caret-blink"
              style={{
                color: '#06021a',
                background: '#ffe17a',
                boxShadow: '0 0 14px rgba(255,225,122,0.95)',
              }}
            >
              {ch === '\n' ? '▼\n' : ch}
            </span>
          );
        }
        if (past && ok) {
          return (
            <span key={i} className="text-[#7cf3ff]" style={{ textShadow: '0 0 6px rgba(124,243,255,0.7)' }}>
              {ch}
            </span>
          );
        }
        if (past && !ok) {
          return (
            <span
              key={i}
              className="text-[#ff4d6d]"
              style={{
                textShadow: '-1px 0 0 rgba(255,90,212,0.9), 1px 0 0 rgba(124,243,255,0.9), 0 0 10px rgba(255,77,109,0.8)',
                background: 'rgba(255,77,109,0.15)',
              }}
            >
              {ch === ' ' ? '✕' : ch}
            </span>
          );
        }
        return <span key={i} className="text-[#f3e9ff]/25">{ch}</span>;
      })}
    </div>
  );
}

function EqBars({ side }: { side: 'left' | 'right' }) {
  const status = useEngineStore((s) => s.status);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);

  const elapsed = useEngineElapsedMs(140);
  const tick = Math.floor(elapsed / 140);
  const wpm = computeWpm(charsCorrect, elapsed);

  // deterministic pseudo-random eq dance driven by wpm + tick + side
  const bars = Array.from({ length: 7 }, (_, i) => {
    const seed = (tick + i + (side === 'left' ? 0 : 3)) * (0.37 + i * 0.11);
    const wobble = (Math.sin(seed) + 1) / 2; // 0..1
    const energy = Math.min(1, wpm / 100);
    const h = status === 'running' ? 12 + wobble * energy * 88 : 10 + (i % 3) * 6;
    return h;
  });

  return (
    <div className="hidden flex-col justify-center gap-1.5 md:flex">
      {bars.map((h, i) => (
        <div key={i} className="relative h-3 w-full overflow-hidden rounded-sm bg-[#1b0548]/80">
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-150"
            style={{
              width: `${h}%`,
              background:
                'linear-gradient(to right, #7cf3ff 0%, #ff5ad4 70%, #ffe17a 100%)',
              boxShadow: '0 0 8px rgba(255,90,212,0.55)',
            }}
          />
        </div>
      ))}
    </div>
  );
}

function SynthScoreboard() {
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const elapsed = useEngineElapsedMs(200);
  const wpm = computeWpm(charsCorrect, elapsed);
  const acc = computeAccuracy(charsCorrect, charsTyped);

  return (
    <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4">
      <Chip label="bpm" value={Math.round(wpm).toString().padStart(3, '0')} color="#ff5ad4" accent />
      <Chip label="fidelity" value={`${(acc * 100).toFixed(0)}%`} color="#7cf3ff" />
      <Chip label="scratches" value={String(errors).padStart(2, '0')} color={errors ? '#ff4d6d' : '#ffbde8'} />
      <Chip label="t" value={fmt(elapsed)} color="#ffe17a" />
    </div>
  );
}

function Chip({
  label,
  value,
  color,
  accent,
}: {
  label: string;
  value: string;
  color: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded border-2 bg-[#06021a]/70 px-3 py-2 text-center"
      style={{
        borderColor: `${color}80`,
        boxShadow: `0 0 15px ${color}33, inset 0 0 14px ${color}14`,
      }}
    >
      <p className="text-[9px] uppercase tracking-[0.4em]" style={{ color: `${color}cc` }}>
        {label}
      </p>
      <p
        className={cn('mt-0.5 font-mono font-black tabular-nums', accent ? 'text-3xl' : 'text-xl')}
        style={{ color, textShadow: `0 0 12px ${color}` }}
      >
        {value}
      </p>
    </div>
  );
}

function SynthFooter({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') {
    return (
      <p
        className="mt-6 text-center text-xs uppercase tracking-[0.5em] text-[#ffe17a] caret-blink"
        style={{ textShadow: '0 0 10px rgba(255,225,122,0.9)' }}
      >
        ▸ drop the needle
      </p>
    );
  }
  return (
    <div className="mt-6 flex justify-center gap-3">
      <button
        type="button"
        onClick={onReset}
        className="rounded border-2 border-[#7cf3ff] bg-[#7cf3ff]/10 px-5 py-2 text-xs uppercase tracking-[0.35em] text-[#7cf3ff] hover:bg-[#7cf3ff]/20"
        style={{ boxShadow: '0 0 16px rgba(124,243,255,0.55)', textShadow: '0 0 8px rgba(124,243,255,0.9)' }}
      >
        Rewind
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded border-2 border-[#ff5ad4] bg-[#ff5ad4]/15 px-5 py-2 text-xs uppercase tracking-[0.35em] text-[#ffbde8] hover:bg-[#ff5ad4]/25"
        style={{ boxShadow: '0 0 20px rgba(255,90,212,0.7)', textShadow: '0 0 10px rgba(255,90,212,0.9)' }}
      >
        Side B ▸
      </button>
    </div>
  );
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
