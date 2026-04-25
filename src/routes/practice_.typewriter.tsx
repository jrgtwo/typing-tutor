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

const TYPEWRITER_KBD: React.CSSProperties = {
  ['--color-paper' as any]: '#1d1914',
  ['--color-paper-deep' as any]: '#332a20',
  ['--color-ink' as any]: '#f1e7cf',
  ['--color-ink-soft' as any]: '#a8987a',
  ['--color-amber' as any]: '#c63d2f',
  ['--color-phosphor' as any]: '#e8dcc2',
  ['--color-phosphor-dim' as any]: '#f1e7cf',
  ['--color-rust' as any]: '#d95a49',
};

export const Route = createFileRoute('/practice_/typewriter')({
  component: TypewriterPractice,
});

/**
 * Noir typewriter: a single spotlit sheet of parchment on a near-black
 * desk. Ribbon-red errors, ink whites. Stats live on a dashed carbon-copy
 * receipt to the right.
 */
function TypewriterPractice() {
  const { passage, passages, index, pickPassage, next, reset } = usePracticeSession();

  return (
    <main className="min-h-screen bg-[#141110] text-[#e8dcc2]">
      <DesignNav />
      <RaccoonCameos />
      {/* desk grain */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(rgba(232,220,194,0.04) 1px, transparent 1px), radial-gradient(rgba(232,220,194,0.03) 1px, transparent 1px)',
          backgroundSize: '3px 3px, 7px 7px',
          backgroundPosition: '0 0, 1px 1px',
        }}
      />
      {/* overhead lamp */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 55% at 50% 40%, rgba(245,220,170,0.08), transparent 70%)',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 py-10 md:grid-cols-[1fr_220px]">
        <div>
          <Link to="/" className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#e8dcc2]/50 hover:text-[#e8dcc2]">
            ← desk
          </Link>

          <h1 className="mt-8 font-serif text-4xl italic text-[#e8dcc2]">
            {passage.title}
          </h1>
          {passage.source && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.4em] text-[#e8dcc2]/45">
              transcribed from · {passage.source}
            </p>
          )}

          {/* paper sheet */}
          <div
            className="relative mt-8 rounded-[2px] bg-[#1d1914] px-10 py-12 shadow-[0_40px_60px_-30px_rgba(0,0,0,0.8),inset_0_0_120px_rgba(0,0,0,0.5)]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(232,220,194,0.03) 0 1px, transparent 1px 30px)',
            }}
          >
            <TypewriterSurface />
            <div className="mt-8 flex items-center justify-between border-t border-dashed border-[#e8dcc2]/15 pt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#e8dcc2]/35">
              <span>— page 1 of 1 —</span>
              <span>rm. 214 · after hours</span>
            </div>
          </div>

          <TypewriterFooter onNext={next} onReset={reset} />

          <BetweenSessionsAd />

          <div className="mt-10" style={TYPEWRITER_KBD}>
            <OnScreenKeyboard />
          </div>

          <div className="mt-12">
            <p className="mb-3 font-serif text-sm italic text-[#e8dcc2]/50">Other pieces in the folder</p>
            <div className="flex flex-wrap gap-2">
              {passages.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickPassage(i)}
                  className={cn(
                    'rounded-[1px] border px-3 py-1 font-mono text-[11px]',
                    i === index
                      ? 'border-[#c63d2f] bg-[#c63d2f]/15 text-[#f1b8ae]'
                      : 'border-[#e8dcc2]/15 text-[#e8dcc2]/60 hover:border-[#e8dcc2]/50 hover:text-[#e8dcc2]',
                  )}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="md:sticky md:top-10 md:h-fit">
          <CarbonCopy passageId={passage.id} />
        </aside>
      </div>
    </main>
  );
}

function TypewriterSurface() {
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const status = useEngineStore((s) => s.status);
  const caretRef = useCaretScroll();

  return (
    <div className="h-[270px] overflow-y-auto whitespace-pre-wrap break-words font-mono text-[20px] leading-[30px] tracking-[0.04em]">
      {Array.from(target).map((ch, i) => {
        const past = i < cursor;
        const current = i === cursor && status !== 'finished';
        const ok = past && typed[i] === ch;

        if (current) {
          return (
            <span
              key={i}
              ref={caretRef}
              className="relative text-[#e8dcc2]"
              style={{
                boxShadow: 'inset 0 -3px 0 #e8dcc2',
              }}
            >
              <span className="caret-blink">{ch === '\n' ? '¶\n' : ch}</span>
            </span>
          );
        }
        if (past && ok) {
          return (
            <span key={i} className="text-[#e8dcc2]" style={{ textShadow: '0 0 0.4px #e8dcc2' }}>
              {ch}
            </span>
          );
        }
        if (past && !ok) {
          return (
            <span key={i} className="text-[#d95a49] line-through decoration-[#c63d2f]/80">
              {ch === ' ' ? '_' : ch}
            </span>
          );
        }
        return <span key={i} className="text-[#e8dcc2]/25">{ch}</span>;
      })}
      {status === 'finished' && <span className="ml-1 text-[#c63d2f]">¬</span>}
    </div>
  );
}

function CarbonCopy({ passageId }: { passageId: string }) {
  const status = useEngineStore((s) => s.status);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const elapsed = useEngineElapsedMs();
  const wpm = computeWpm(charsCorrect, elapsed);
  const acc = computeAccuracy(charsCorrect, charsTyped);

  return (
    <div
      className="rounded-[1px] border border-dashed border-[#e8dcc2]/25 bg-[#1a1612] p-5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#e8dcc2]/70"
      style={{ boxShadow: '0 20px 40px -20px rgba(0,0,0,0.7)' }}
    >
      <p className="mb-3 text-[10px] tracking-[0.4em] text-[#c63d2f]/80">— carbon copy —</p>
      <dl className="space-y-2">
        <Row label="ref" value={passageId} />
        <Row label="status" value={status} />
        <Row label="wpm" value={wpm.toFixed(1)} big />
        <Row label="acc" value={`${(acc * 100).toFixed(1)}%`} />
        <Row label="errs" value={String(errors)} />
        <Row label="time" value={fmt(elapsed)} />
      </dl>
      <p className="mt-5 border-t border-dashed border-[#e8dcc2]/20 pt-3 text-[9px] normal-case italic tracking-[0.05em] text-[#e8dcc2]/40">
        filed without comment.
      </p>
    </div>
  );
}

function Row({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[#e8dcc2]/45">{label}</dt>
      <dd className={cn('tabular-nums', big ? 'text-lg text-[#f1b8ae]' : 'text-[#e8dcc2]')}>
        {value}
      </dd>
    </div>
  );
}

function TypewriterFooter({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') {
    return (
      <p className="mt-6 font-serif text-sm italic text-[#e8dcc2]/50">
        Strike the keys. The ribbon remembers.
      </p>
    );
  }
  return (
    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={onReset}
        className="rounded-[1px] border border-[#e8dcc2]/40 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.3em] text-[#e8dcc2]/80 hover:border-[#e8dcc2] hover:text-[#e8dcc2]"
      >
        Rewind
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-[1px] border border-[#c63d2f] bg-[#c63d2f]/20 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.3em] text-[#f1b8ae] hover:bg-[#c63d2f]/30"
      >
        New page →
      </button>
    </div>
  );
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
