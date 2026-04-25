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

const TERMINAL_KBD: React.CSSProperties = {
  ['--color-paper' as any]: '#061206',
  ['--color-paper-deep' as any]: '#143214',
  ['--color-ink' as any]: '#c1ff97',
  ['--color-ink-soft' as any]: '#7fb069',
  ['--color-amber' as any]: '#c1ff97',
  ['--color-phosphor' as any]: '#7fb069',
  ['--color-phosphor-dim' as any]: '#c1ff97',
  ['--color-rust' as any]: '#ff7a5c',
};

export const Route = createFileRoute('/practice_/terminal')({
  component: TerminalPractice,
});

function TerminalPractice() {
  const { passage, passages, index, pickPassage, next, reset } = usePracticeSession();

  return (
    <main className="min-h-screen bg-black font-mono text-[#7fb069] selection:bg-[#7fb069] selection:text-black">
      <DesignNav />
      <RaccoonCameos />
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#7fb069]/60">
          <Link to="/" className="hover:text-[#7fb069]">../</Link>
          <span>tty1 · {new Date().toLocaleTimeString('en-GB', { hour12: false })}</span>
        </div>

        <pre className="mb-4 text-[11px] leading-[1.15] text-[#7fb069]/50">{BANNER}</pre>

        <div className="mb-4 text-sm">
          <span className="text-[#7fb069]/50">user@raccoon</span>
          <span className="text-[#7fb069]/30">:</span>
          <span className="text-[#7fb069]/70">~/practice</span>
          <span className="text-[#7fb069]/30">$ </span>
          <span>practice --mode={passage.modeId} --id={passage.id}</span>
        </div>

        <TerminalHud />

        <div className="my-4 border-y border-[#7fb069]/20 py-6">
          <TerminalSurface />
        </div>

        <TerminalFooter onNext={next} onReset={reset} />

        <BetweenSessionsAd />

        <div className="mt-8" style={TERMINAL_KBD}>
          <OnScreenKeyboard />
        </div>

        <div className="mt-10">
          <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#7fb069]/50">
            # ls ./passages
          </p>
          <div className="grid grid-cols-2 gap-1 text-sm md:grid-cols-4">
            {passages.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickPassage(i)}
                className={cn(
                  'truncate border px-2 py-1 text-left transition-colors',
                  i === index
                    ? 'border-[#7fb069] bg-[#7fb069]/10 text-[#c1ff97]'
                    : 'border-[#7fb069]/20 text-[#7fb069]/70 hover:border-[#7fb069]/60 hover:text-[#7fb069]',
                )}
              >
                <span className="text-[#7fb069]/40">./</span>{p.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'repeating-linear-gradient(to bottom, rgba(127,176,105,0.05) 0, rgba(127,176,105,0.05) 1px, transparent 1px, transparent 3px)',
        }}
      />
    </main>
  );
}

function TerminalHud() {
  const status = useEngineStore((s) => s.status);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const elapsed = useEngineElapsedMs();
  const wpm = computeWpm(charsCorrect, elapsed);
  const acc = computeAccuracy(charsCorrect, charsTyped);

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[#7fb069]/80">
      <span>[wpm <span className="text-[#c1ff97]">{wpm.toFixed(0).padStart(3, '0')}</span>]</span>
      <span>[acc <span className="text-[#c1ff97]">{(acc * 100).toFixed(1)}%</span>]</span>
      <span>[err <span className={errors === 0 ? 'text-[#7fb069]/50' : 'text-[#ff7a5c]'}>{String(errors).padStart(2, '0')}</span>]</span>
      <span>[t <span className="text-[#c1ff97]">{fmt(elapsed)}</span>]</span>
      <span className="ml-auto text-[#7fb069]/60">status: {status}</span>
    </div>
  );
}

function TerminalSurface() {
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const status = useEngineStore((s) => s.status);
  const caretRef = useCaretScroll();

  return (
    <div className="h-[260px] overflow-y-auto whitespace-pre-wrap break-words font-mono text-[22px] leading-[1.55] tracking-wide">
      {Array.from(target).map((ch, i) => {
        const past = i < cursor;
        const current = i === cursor && status !== 'finished';
        const ok = past && typed[i] === ch;
        if (current) {
          return (
            <span key={i} ref={caretRef} className="bg-[#7fb069] text-black">
              {ch === '\n' ? '↵\n' : ch}
            </span>
          );
        }
        if (past && ok) return <span key={i} className="text-[#c1ff97]">{ch}</span>;
        if (past && !ok) return <span key={i} className="bg-[#ff7a5c]/20 text-[#ff7a5c] underline decoration-[#ff7a5c]">{ch === ' ' ? '·' : ch}</span>;
        return <span key={i} className="text-[#7fb069]/40">{ch}</span>;
      })}
      {status !== 'finished' && (
        <span className="ml-0.5 inline-block h-[1em] w-[0.55em] align-middle bg-[#7fb069] caret-blink" />
      )}
    </div>
  );
}

function TerminalFooter({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') {
    return (
      <p className="text-sm text-[#7fb069]/60">
        <span className="text-[#7fb069]/40"># </span>awaiting input — type to begin.
      </p>
    );
  }
  return (
    <div className="flex gap-3 text-sm">
      <button type="button" onClick={onReset} className="border border-[#7fb069]/60 px-3 py-1 hover:bg-[#7fb069]/10">
        [r]etry
      </button>
      <button type="button" onClick={onNext} className="border border-[#c1ff97] bg-[#7fb069]/20 px-3 py-1 text-[#c1ff97] hover:bg-[#7fb069]/30">
        [n]ext &gt;
      </button>
    </div>
  );
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const BANNER = ` _____                   ____
|_   _|   _ _ __   ___  / /\\ \\
  | || | | | '_ \\ / _ \\/ /  \\ \\   raccoon terminal v0.1
  | || |_| | |_) |  __/ \\  / /   © ghostly keys, inc.
  |_| \\__, | .__/ \\___|  \\/ /
      |___/|_|            \\_/`;
