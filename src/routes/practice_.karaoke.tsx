import { useMemo } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useEngineElapsedMs } from '@/hooks/useEngineElapsedMs';
import { DesignNav } from '@/components/DesignNav';
import { RaccoonCameos } from '@/components/mascot/RaccoonCameos';
import { OnScreenKeyboard } from '@/components/typing/OnScreenKeyboard';
import { BetweenSessionsAd } from '@/components/ads/BetweenSessionsAd';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/practice_/karaoke')({
  component: KaraokePractice,
});

const KARAOKE_KBD: React.CSSProperties = {
  ['--color-paper' as any]: '#0d0a20',
  ['--color-paper-deep' as any]: '#2a1855',
  ['--color-ink' as any]: '#ffffff',
  ['--color-ink-soft' as any]: '#b39cff',
  ['--color-amber' as any]: '#ffe17a',
  ['--color-phosphor' as any]: '#7ad7ff',
  ['--color-phosphor-dim' as any]: '#c4ecff',
  ['--color-rust' as any]: '#ff6787',
};

/**
 * karaoke: passage is sliced into chunks (by newlines, otherwise by
 * sentence). Only the current chunk is full-size and bright — previous
 * and next chunks float as dim ghosts above and below. Big stage
 * lighting, no "card". Scoreboard is two small corner chips.
 */
function KaraokePractice() {
  const { passage, passages, index, pickPassage, next, reset } = usePracticeSession();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060318] text-[#ffffff]">
      <DesignNav />
      <RaccoonCameos />

      {/* stage spot */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 45% 35% at 50% 45%, rgba(122,215,255,0.22), transparent 70%), radial-gradient(ellipse 30% 20% at 30% 20%, rgba(255,122,204,0.18), transparent 70%), radial-gradient(ellipse 30% 20% at 70% 25%, rgba(255,225,122,0.12), transparent 70%)',
        }}
      />
      {/* floor fog */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            'linear-gradient(to top, rgba(122,215,255,0.18), transparent)',
        }}
      />

      {/* corner score chips */}
      <div className="pointer-events-none absolute left-5 top-5 z-30">
        <ScoreChip label="wpm" sampler="wpm" color="#7ad7ff" />
      </div>
      <div className="pointer-events-none absolute right-5 top-5 z-30">
        <ScoreChip label="acc" sampler="acc" color="#ffe17a" />
      </div>

      {/* top nav (unobtrusive) */}
      <div className="absolute inset-x-0 top-5 z-20 text-center">
        <Link
          to="/"
          className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/50 hover:text-white"
        >
          ◂ backstage
        </Link>
        <p
          className="mt-1 font-serif text-sm italic text-[#b39cff]"
          style={{ textShadow: '0 0 10px rgba(179,156,255,0.5)' }}
        >
          now performing · {passage.title}
        </p>
      </div>

      <Stage />

      {/* bottom: passage picker as setlist + subtle keyboard */}
      <div className="absolute inset-x-0 bottom-0 z-10">
        <div className="mx-auto max-w-5xl px-6 pb-4 pt-6">
          <p
            className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.5em] text-white/40"
          >
            setlist
          </p>
          <div className="mb-5 flex justify-center gap-2">
            {passages.map((p, i) => {
              const active = i === index;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPassage(i)}
                  className={cn(
                    'rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-widest',
                    active
                      ? 'border-[#ffe17a] bg-[#ffe17a]/10 text-[#ffe17a]'
                      : 'border-white/20 text-white/60 hover:border-white/50 hover:text-white',
                  )}
                  style={active ? { textShadow: '0 0 10px rgba(255,225,122,0.9)' } : undefined}
                >
                  {String(i + 1).padStart(2, '0')} · {p.title}
                </button>
              );
            })}
          </div>
          <KaraokeFooter onNext={next} onReset={reset} />
          <BetweenSessionsAd />
          <div className="mt-4 opacity-40 transition-opacity duration-300 hover:opacity-100" style={KARAOKE_KBD}>
            <OnScreenKeyboard />
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Compute chunk slices once per target change. A chunk is either a
 * non-empty line, or (for single-line prose) a sentence-sized piece.
 * Each chunk knows its absolute [start, end) character range so we can
 * locate the cursor in chunk-space without re-scanning.
 */
function useChunks() {
  const target = useEngineStore((s) => s.target);
  return useMemo(() => buildChunks(target), [target]);
}

interface Chunk {
  text: string;
  start: number;
  end: number;
}

function buildChunks(target: string): Chunk[] {
  if (!target) return [{ text: '', start: 0, end: 0 }];

  // Prefer line-based splitting when there are real newlines.
  if (target.includes('\n')) {
    const chunks: Chunk[] = [];
    let cursor = 0;
    for (const piece of target.split('\n')) {
      const start = cursor;
      const text = piece + '\n';
      const end = start + text.length;
      chunks.push({ text: piece, start, end });
      cursor = end;
    }
    return chunks.filter((c) => c.text.trim().length > 0 || chunks.length === 1);
  }

  // Otherwise, split at sentence boundaries (. ! ?) with lookbehind
  // kept simple: walk and cut when we see sentence-final punct + space.
  const chunks: Chunk[] = [];
  let start = 0;
  for (let i = 0; i < target.length; i++) {
    const ch = target[i];
    const nextIsBoundary = /[.!?]/.test(ch) && (i + 1 === target.length || target[i + 1] === ' ');
    if (nextIsBoundary) {
      const end = i + 2 <= target.length ? i + 2 : target.length;
      chunks.push({ text: target.slice(start, end).trim(), start, end });
      start = end;
    }
  }
  if (start < target.length) {
    chunks.push({ text: target.slice(start).trim(), start, end: target.length });
  }
  return chunks.length ? chunks : [{ text: target, start: 0, end: target.length }];
}

function Stage() {
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const target = useEngineStore((s) => s.target);
  const status = useEngineStore((s) => s.status);
  const chunks = useChunks();

  const activeIdx = useMemo(() => {
    for (let i = 0; i < chunks.length; i++) {
      if (cursor < chunks[i].end) return i;
    }
    return chunks.length - 1;
  }, [chunks, cursor]);

  const prev = activeIdx > 0 ? chunks[activeIdx - 1] : null;
  const active = chunks[activeIdx];
  const next = activeIdx < chunks.length - 1 ? chunks[activeIdx + 1] : null;

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8">
      <div className="w-full max-w-5xl space-y-8 text-center">
        {prev ? (
          <GhostLine text={prev.text} dir="up" />
        ) : (
          <div className="h-8" />
        )}

        <StageLine chunk={active} cursor={cursor} typed={typed} target={target} finished={status === 'finished'} />

        {next ? (
          <GhostLine text={next.text} dir="down" />
        ) : (
          <div className="h-8" />
        )}
      </div>
    </div>
  );
}

function GhostLine({ text, dir }: { text: string; dir: 'up' | 'down' }) {
  return (
    <p
      className={cn(
        'truncate font-serif text-xl italic text-white/25',
        dir === 'up' ? 'opacity-60' : 'opacity-50',
      )}
    >
      {text.trim() || '·'}
    </p>
  );
}

function StageLine({
  chunk,
  cursor,
  typed,
  target,
  finished,
}: {
  chunk: Chunk;
  cursor: number;
  typed: string;
  target: string;
  finished: boolean;
}) {
  const chars = Array.from(target.slice(chunk.start, chunk.end));
  return (
    <div className="flex h-[180px] items-center justify-center overflow-hidden">
      <p className="font-serif text-5xl leading-[1.25] md:text-6xl" style={{ textShadow: '0 0 40px rgba(122,215,255,0.35)' }}>
      {chars.map((ch, i) => {
        const abs = chunk.start + i;
        const past = abs < cursor;
        const current = abs === cursor && !finished;
        const ok = past && typed[abs] === ch;

        if (ch === '\n') return null;

        if (current) {
          return (
            <span
              key={i}
              className="caret-blink"
              style={{
                color: '#060318',
                background: '#ffe17a',
                padding: '0 4px',
                borderRadius: 4,
                boxShadow: '0 0 24px rgba(255,225,122,0.95)',
              }}
            >
              {ch}
            </span>
          );
        }
        if (past && ok) {
          return (
            <span key={i} className="text-white" style={{ textShadow: '0 0 16px rgba(122,215,255,0.7)' }}>
              {ch}
            </span>
          );
        }
        if (past && !ok) {
          return (
            <span
              key={i}
              className="text-[#ff6787]"
              style={{ textShadow: '0 0 14px rgba(255,103,135,0.8)' }}
            >
              {ch === ' ' ? '_' : ch}
            </span>
          );
        }
        return <span key={i} className="text-white/35">{ch}</span>;
      })}
      </p>
    </div>
  );
}

function ScoreChip({ label, sampler, color }: { label: string; sampler: 'wpm' | 'acc'; color: string }) {
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);

  const elapsed = useEngineElapsedMs();
  const value = sampler === 'wpm'
    ? Math.round(computeWpm(charsCorrect, elapsed)).toString()
    : `${(computeAccuracy(charsCorrect, charsTyped) * 100).toFixed(0)}%`;

  return (
    <div
      className="rounded-full border bg-black/40 px-4 py-2 font-mono text-center backdrop-blur-sm"
      style={{
        borderColor: `${color}80`,
        boxShadow: `0 0 16px ${color}44`,
      }}
    >
      <p className="text-[9px] uppercase tracking-[0.4em]" style={{ color: `${color}cc` }}>{label}</p>
      <p
        className="text-xl font-black tabular-nums"
        style={{ color, textShadow: `0 0 10px ${color}` }}
      >
        {value}
      </p>
    </div>
  );
}

function KaraokeFooter({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') {
    return (
      <p
        className="text-center font-mono text-[11px] uppercase tracking-[0.5em] text-white/50"
      >
        hit the keys — the crowd is waiting
      </p>
    );
  }
  return (
    <div className="flex justify-center gap-3">
      <button
        type="button"
        onClick={onReset}
        className="rounded-full border border-[#7ad7ff] bg-[#7ad7ff]/10 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.35em] text-[#7ad7ff] hover:bg-[#7ad7ff]/20"
        style={{ textShadow: '0 0 10px rgba(122,215,255,0.85)' }}
      >
        Encore
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-full border border-[#ffe17a] bg-[#ffe17a]/15 px-5 py-2 font-mono text-[11px] uppercase tracking-[0.35em] text-[#ffe17a] hover:bg-[#ffe17a]/25"
        style={{ textShadow: '0 0 10px rgba(255,225,122,0.9)' }}
      >
        Next song ▸
      </button>
    </div>
  );
}
