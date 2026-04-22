import { useEffect, useRef, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { DesignNav } from '@/components/DesignNav';
import { OnScreenKeyboard } from '@/components/typing/OnScreenKeyboard';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/practice_/chat')({
  component: ChatPractice,
});

const CHAT_KBD: React.CSSProperties = {
  ['--color-paper' as any]: '#14171f',
  ['--color-paper-deep' as any]: '#2b2f3c',
  ['--color-ink' as any]: '#e6e8ef',
  ['--color-ink-soft' as any]: '#8993a8',
  ['--color-amber' as any]: '#ffb74d',
  ['--color-phosphor' as any]: '#4aa6ff',
  ['--color-phosphor-dim' as any]: '#8dc4ff',
  ['--color-rust' as any]: '#ff6b7a',
};

/**
 * chat: the raccoon DM's you a passage; you reply by typing it. Thread
 * history doubles as the passage picker (prior passages live as past
 * messages). Composer at the bottom *is* the typing surface.
 */
function ChatPractice() {
  const { passage, passages, index, pickPassage, next, reset } = usePracticeSession();
  const scroller = useRef<HTMLDivElement>(null);

  // keep latest message in view when switching passages
  useEffect(() => {
    if (!scroller.current) return;
    scroller.current.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [index]);

  return (
    <main className="relative flex min-h-screen flex-col bg-[#0b0d13] text-[#e6e8ef]">
      <DesignNav />

      {/* thread header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-[#2b2f3c] bg-[#0b0d13]/95 px-6 py-3 backdrop-blur">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#8993a8] hover:text-white">
          ◂
        </Link>
        <RaccoonAvatar size={40} />
        <div className="flex-1 leading-tight">
          <p className="font-semibold text-[#e6e8ef]">remy · the raccoon</p>
          <p className="flex items-center gap-1.5 text-xs text-[#8993a8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4aa6ff]" style={{ boxShadow: '0 0 6px #4aa6ff' }} />
            online · looking disappointed
          </p>
        </div>
        <LiveMeter />
      </header>

      {/* scrollable thread */}
      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          <DateDivider label="today" />

          {/* older passages rendered as completed outgoing messages */}
          {passages.slice(0, index).map((p) => (
            <OutgoingBubble key={p.id} text={p.body} meta={`sent · ${p.title}`} onPick={() => pickPassage(passages.indexOf(p))} />
          ))}

          {/* incoming: raccoon sent you the current passage */}
          <div className="flex items-end gap-2">
            <RaccoonAvatar size={28} />
            <div className="max-w-[78%] space-y-1">
              <p className="ml-3 text-[11px] text-[#8993a8]">remy · {raccoonHint(passage.modeId)}</p>
              <div
                className="rounded-3xl rounded-bl-md bg-[#1c2030] px-4 py-3 text-[15px] leading-relaxed"
                style={{ boxShadow: '0 2px 14px rgba(0,0,0,0.25)' }}
              >
                {passage.body}
              </div>
              <p className="ml-3 text-[10px] uppercase tracking-[0.25em] text-[#8993a8]/70">
                {passage.title}{passage.source && ` · ${passage.source}`}
              </p>
            </div>
          </div>

          {/* upcoming passages as a subtle "queued" hint at the top — or next below? put below as "next in queue" */}
          {passages.slice(index + 1).length > 0 && (
            <section className="mt-4">
              <p className="mb-1 text-center text-[10px] uppercase tracking-[0.4em] text-[#8993a8]/60">
                queue
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {passages.slice(index + 1).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pickPassage(passages.indexOf(p))}
                    className="rounded-full border border-[#2b2f3c] bg-[#14171f] px-3 py-1 text-xs text-[#8993a8] hover:border-[#4aa6ff] hover:text-white"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* your live reply */}
          <LiveReply onReset={reset} onNext={next} />
        </div>
      </div>

      {/* composer / keyboard dock */}
      <footer className="border-t border-[#2b2f3c] bg-[#0b0d13] px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <ComposerBar />
          <div className="mt-3" style={CHAT_KBD}>
            <OnScreenKeyboard />
          </div>
        </div>
      </footer>
    </main>
  );
}

function raccoonHint(mode: string) {
  return mode === 'code'
    ? 'type this. curly braces count. try not to embarrass us both.'
    : 'send this back word for word. i\'ll be watching.';
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="my-2 flex items-center gap-3 text-[10px] uppercase tracking-[0.5em] text-[#8993a8]/50">
      <div className="h-px flex-1 bg-[#2b2f3c]" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-[#2b2f3c]" />
    </div>
  );
}

function OutgoingBubble({ text, meta, onPick }: { text: string; meta: string; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} className="group flex flex-col items-end text-right">
      <div
        className="max-w-[78%] rounded-3xl rounded-br-md bg-[#4aa6ff] px-4 py-3 text-[14px] leading-relaxed text-white"
        style={{ boxShadow: '0 2px 14px rgba(74,166,255,0.25)' }}
      >
        <span className="line-clamp-2 opacity-90">{text}</span>
      </div>
      <p className="mr-3 mt-1 text-[10px] uppercase tracking-[0.25em] text-[#8993a8]/70 group-hover:text-[#4aa6ff]">
        {meta} · tap to re-send
      </p>
    </button>
  );
}

function LiveReply({ onReset, onNext }: { onReset: () => void; onNext: () => void }) {
  const status = useEngineStore((s) => s.status);
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);

  if (status === 'idle' || cursor === 0) return null;

  // finished → show a posted reply bubble + raccoon reaction
  const finished = status === 'finished';
  const elapsed = startedAt && finishedAt ? finishedAt - startedAt : 0;
  const wpm = computeWpm(charsCorrect, elapsed);
  const acc = computeAccuracy(charsCorrect, charsTyped);

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <div
          className={cn(
            'max-w-[78%] rounded-3xl rounded-br-md px-4 py-3 text-[15px] leading-relaxed',
            finished ? 'bg-[#4aa6ff] text-white' : 'bg-[#253050] text-[#e6e8ef]',
          )}
          style={{
            boxShadow: finished
              ? '0 2px 14px rgba(74,166,255,0.35)'
              : '0 2px 10px rgba(0,0,0,0.25)',
          }}
        >
          <LiveText target={target} typed={typed} cursor={cursor} finished={finished} />
        </div>
        <p className="mr-3 text-[10px] uppercase tracking-[0.25em] text-[#8993a8]/70">
          {finished
            ? `delivered · ${wpm.toFixed(0)} wpm · ${(acc * 100).toFixed(0)}%`
            : 'typing…'}
        </p>
      </div>

      {finished && (
        <>
          <div className="flex items-end gap-2">
            <RaccoonAvatar size={28} />
            <div className="max-w-[78%]">
              <div className="rounded-3xl rounded-bl-md bg-[#1c2030] px-4 py-3 text-[14px] italic leading-relaxed text-[#b8c2d9]">
                {raccoonReaction(wpm, acc)}
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onReset}
              className="rounded-full border border-[#2b2f3c] bg-[#14171f] px-4 py-1.5 text-xs text-[#8dc4ff] hover:border-[#4aa6ff]"
            >
              Retype
            </button>
            <button
              type="button"
              onClick={onNext}
              className="rounded-full bg-[#4aa6ff] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#5fb5ff]"
              style={{ boxShadow: '0 0 20px rgba(74,166,255,0.45)' }}
            >
              Ask for another →
            </button>
          </div>
        </>
      )}
    </>
  );
}

function raccoonReaction(wpm: number, acc: number): string {
  if (acc < 0.85) return 'a bold interpretation. have you considered reading before typing?';
  if (wpm < 30) return 'we got there eventually. like a glacier, but less impressive.';
  if (wpm < 55) return 'fine. perfectly fine. almost indistinguishable from caring.';
  if (acc > 0.98 && wpm > 70) return 'fine. that was actually good. don\'t let it go to your head.';
  if (wpm >= 80) return 'okay okay okay. show-off.';
  return 'acceptable. i\'ll allow it.';
}

function LiveText({
  target,
  typed,
  cursor,
  finished,
}: {
  target: string;
  typed: string;
  cursor: number;
  finished: boolean;
}) {
  return (
    <span className="font-mono text-[14px]">
      {Array.from(target).map((ch, i) => {
        const past = i < cursor;
        const current = i === cursor && !finished;
        const ok = past && typed[i] === ch;

        if (current) {
          return (
            <span
              key={i}
              className="caret-blink"
              style={{
                background: 'rgba(255,255,255,0.35)',
                borderRadius: 2,
              }}
            >
              {ch === '\n' ? '↵\n' : ch}
            </span>
          );
        }
        if (past && ok) return <span key={i}>{ch}</span>;
        if (past && !ok) {
          return (
            <span key={i} style={{ color: '#ff9bb0', textDecoration: 'underline wavy #ff6b7a' }}>
              {ch === ' ' ? '_' : ch}
            </span>
          );
        }
        return <span key={i} className="opacity-40">{ch}</span>;
      })}
    </span>
  );
}

function ComposerBar() {
  const status = useEngineStore((s) => s.status);
  const cursor = useEngineStore((s) => s.cursor);
  const target = useEngineStore((s) => s.target);
  const pct = target.length ? Math.round((cursor / target.length) * 100) : 0;

  return (
    <div className="flex items-center gap-3 rounded-full border border-[#2b2f3c] bg-[#14171f] px-4 py-2">
      <span className="h-2 w-2 rounded-full bg-[#4aa6ff]" style={{ boxShadow: '0 0 6px #4aa6ff' }} />
      <span className="flex-1 truncate text-xs text-[#8993a8]">
        {status === 'finished'
          ? 'sent. message delivered.'
          : status === 'running'
            ? `composing reply… ${pct}%`
            : 'start typing to compose your reply'}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#8993a8]/70">
        enter = newline
      </span>
    </div>
  );
}

function LiveMeter() {
  const status = useEngineStore((s) => s.status);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [status]);

  const end = status === 'finished' ? (finishedAt ?? now) : now;
  const elapsed = startedAt ? Math.max(0, end - startedAt) : 0;
  const wpm = computeWpm(charsCorrect, elapsed);

  return (
    <div className="text-right font-mono">
      <p className="text-[9px] uppercase tracking-[0.3em] text-[#8993a8]">live</p>
      <p className="text-sm tabular-nums text-[#4aa6ff]" style={{ textShadow: '0 0 8px rgba(74,166,255,0.5)' }}>
        {Math.round(wpm)} wpm
      </p>
    </div>
  );
}

function RaccoonAvatar({ size }: { size: number }) {
  // playful SVG mask face — not a real raccoon, just a stand-in until we have an asset
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#36405a] to-[#1c2030]"
      style={{ width: size, height: size, boxShadow: '0 0 0 1px #2b2f3c, 0 4px 12px rgba(0,0,0,0.4)' }}
    >
      <svg viewBox="0 0 40 40" width={size * 0.7} height={size * 0.7}>
        <ellipse cx="20" cy="22" rx="14" ry="11" fill="#c7c9d1" />
        <path d="M6 18 Q20 8 34 18 L30 22 Q20 14 10 22 Z" fill="#2b2f3c" />
        <ellipse cx="13" cy="22" rx="4" ry="3.5" fill="#2b2f3c" />
        <ellipse cx="27" cy="22" rx="4" ry="3.5" fill="#2b2f3c" />
        <circle cx="13" cy="22" r="1.3" fill="#e6e8ef" />
        <circle cx="27" cy="22" r="1.3" fill="#e6e8ef" />
        <ellipse cx="20" cy="28" rx="1.8" ry="1.3" fill="#1a1d26" />
      </svg>
    </div>
  );
}
