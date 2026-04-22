import { useEffect, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { DesignNav } from '@/components/DesignNav';
import { OnScreenKeyboard } from '@/components/typing/OnScreenKeyboard';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/practice_/desk')({
  component: DeskPractice,
});

const DESK_KBD: React.CSSProperties = {
  ['--color-paper' as any]: '#1a1410',
  ['--color-paper-deep' as any]: '#2d2218',
  ['--color-ink' as any]: '#f1e4c5',
  ['--color-ink-soft' as any]: '#a8987a',
  ['--color-amber' as any]: '#e5a042',
  ['--color-phosphor' as any]: '#89a96a',
  ['--color-phosphor-dim' as any]: '#b7d193',
  ['--color-rust' as any]: '#c85a4a',
};

/**
 * desk: 2D scattered workspace. Instead of stacked sections, objects
 * live at spatial coordinates on a dark-wood desk — notepad, sticky
 * notes, torn typo-receipt, mini calendar, physical keyboard. Rotation
 * and drop-shadow do most of the work; the grid is intentionally off.
 */
function DeskPractice() {
  const { passage, passages, index, pickPassage, next, reset } = usePracticeSession();

  return (
    <main
      className="relative min-h-screen overflow-hidden text-[#2a1f12]"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 50% 45%, #3a2614 0%, #1d130a 80%)',
      }}
    >
      <DesignNav />

      {/* wood grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'repeating-linear-gradient(87deg, rgba(80,52,28,0.3) 0px, rgba(80,52,28,0.3) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(91deg, rgba(20,12,6,0.5) 0px, rgba(20,12,6,0.5) 1px, transparent 1px, transparent 9px)',
        }}
      />
      {/* lamp pool */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 45% at 52% 40%, rgba(255,210,140,0.22), transparent 70%)',
        }}
      />
      {/* coffee ring stain (decor) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: '8%',
          top: '18%',
          width: 120,
          height: 120,
          border: '4px solid rgba(60,35,15,0.35)',
          borderRadius: '50%',
          filter: 'blur(1.5px)',
          transform: 'rotate(-12deg)',
        }}
      />

      <div className="relative z-10">
        {/* top bar floats like a little metal clip on the desk edge */}
        <header className="flex items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="rounded-full bg-[#f1e4c5]/90 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#2a1f12] shadow-md hover:bg-white"
          >
            ◂ leave desk
          </Link>
          <IndexCard title={passage.title} source={passage.source} modeId={passage.modeId} />
        </header>

        {/* scatter zone — three columns: left sidebar, hero notepad, right sidebar.
            Absolute items keep the tactile scattered feel but sit inside
            sized columns so nothing drifts into empty desk. */}
        <section className="relative mx-auto grid max-w-6xl grid-cols-[220px_1fr_220px] items-start gap-8 px-6 pb-6">
          {/* left column: receipt + stickies */}
          <div className="relative h-full pt-2">
            <div className="mb-5" style={{ transform: 'rotate(-5deg)' }}>
              <TypoReceipt />
            </div>
            <div className="mb-5 flex justify-center" style={{ transform: 'rotate(-4deg)' }}>
              <Sticky color="#ffd66b">
                <StickyStat sampler="wpm" label="WPM" big />
              </Sticky>
            </div>
            <div className="flex justify-center" style={{ transform: 'rotate(5deg)' }}>
              <Sticky color="#9ddaa3">
                <StickyStat sampler="acc" label="ACC" />
              </Sticky>
            </div>
          </div>

          {/* hero notepad, slight tilt */}
          <div
            className="relative mx-auto w-full max-w-[640px]"
            style={{ transform: 'rotate(-0.8deg)' }}
          >
            <Notepad passage={passage} />
          </div>

          {/* right column: calendar + sticky + card stack */}
          <div className="relative h-full pt-2">
            <div className="mb-5 flex justify-center" style={{ transform: 'rotate(4deg)' }}>
              <Calendar total={passages.length} index={index} />
            </div>
            <div className="mb-5 flex justify-center" style={{ transform: 'rotate(-3deg)' }}>
              <Sticky color="#f5a99a">
                <StickyStat sampler="err" label="ERR" />
              </Sticky>
            </div>
            <div className="flex justify-center">
              <CardStack passages={passages} index={index} pickPassage={pickPassage} />
            </div>
          </div>

          {/* floating pocketwatch — bottom left of notepad, rotated */}
          <div
            className="pointer-events-none absolute z-10"
            style={{
              left: '18%',
              bottom: -34,
              transform: 'rotate(8deg)',
            }}
          >
            <Pocketwatch />
          </div>
        </section>

        {/* footer — actions */}
        <div className="relative px-6 pb-6 pt-2">
          <DeskFooter onNext={next} onReset={reset} />

          {/* keyboard — the physical object */}
          <div className="mx-auto mt-6 max-w-3xl">
            <div
              className="rounded-xl p-5"
              style={{
                background:
                  'linear-gradient(180deg, #2a1d12 0%, #1a1108 100%)',
                boxShadow:
                  '0 18px 40px -10px rgba(0,0,0,0.8), 0 2px 0 #3d2a18, inset 0 1px 0 rgba(255,200,140,0.1), inset 0 -2px 0 rgba(0,0,0,0.5)',
                ...DESK_KBD,
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#b7d193]/80">model f · walnut</p>
                <span className="h-1.5 w-1.5 rounded-full bg-[#89a96a]" style={{ boxShadow: '0 0 6px #89a96a' }} />
              </div>
              <OnScreenKeyboard />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Notepad({
  passage,
}: {
  passage: { title: string; body: string; modeId: string };
}) {
  return (
    <article
      className="relative rounded-sm pb-10 pl-10 pr-10 pt-14"
      style={{
        backgroundColor: '#faf2d9',
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(90,70,40,0.08) 0 1px, transparent 1px 32px), linear-gradient(180deg, #faf2d9 0%, #efdfb3 100%)',
        boxShadow:
          '0 3px 0 #d8c28a, 0 6px 0 #c4ab6d, 0 30px 50px -10px rgba(0,0,0,0.6), 0 60px 80px -20px rgba(0,0,0,0.5)',
        color: '#2a1f12',
      }}
    >
      {/* spiral binding bar */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-8 rounded-t-sm"
        style={{
          background: 'linear-gradient(180deg, #6a4820 0%, #3d2a14 100%)',
          boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,140,0.2)',
        }}
      />
      {/* holes in the binding */}
      <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-around px-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="block h-4 w-4 rounded-full"
            style={{
              background: '#0e0805',
              boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.9), 0 1px 0 rgba(255,200,140,0.15)',
            }}
          />
        ))}
      </div>

      <div className="mb-4 border-b border-[#8a6a3a]/40 pb-2 font-serif italic">
        <span className="text-sm">— {passage.title} —</span>
      </div>

      <DeskSurface />
    </article>
  );
}

function DeskSurface() {
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const status = useEngineStore((s) => s.status);

  return (
    <div className="whitespace-pre-wrap break-words font-mono text-[19px] leading-[30px] tracking-[0.02em]">
      {Array.from(target).map((ch, i) => {
        const past = i < cursor;
        const current = i === cursor && status !== 'finished';
        const ok = past && typed[i] === ch;

        if (current) {
          return (
            <span
              key={i}
              className="caret-blink"
              style={{
                background: '#2a1f12',
                color: '#faf2d9',
                padding: '0 2px',
                borderRadius: 2,
              }}
            >
              {ch === '\n' ? '¶\n' : ch}
            </span>
          );
        }
        if (past && ok) {
          return (
            <span key={i} style={{ color: '#2a1f12' }}>
              {ch}
            </span>
          );
        }
        if (past && !ok) {
          return (
            <span
              key={i}
              style={{
                color: '#c85a4a',
                textDecoration: 'line-through wavy #c85a4a',
              }}
            >
              {ch === ' ' ? '_' : ch}
            </span>
          );
        }
        return <span key={i} style={{ color: 'rgba(42,31,18,0.35)' }}>{ch}</span>;
      })}
    </div>
  );
}

function Sticky({
  children,
  color,
  className,
  style,
}: {
  children: React.ReactNode;
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn('w-[150px] p-4 text-center text-[#2a1f12]', className)}
      style={{
        background: color,
        boxShadow:
          '0 12px 20px -8px rgba(0,0,0,0.6), inset 0 -12px 14px -10px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.35)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function StickyStat({ sampler, label, big }: { sampler: 'wpm' | 'acc' | 'err'; label: string; big?: boolean }) {
  const status = useEngineStore((s) => s.status);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [status]);

  const end = status === 'finished' ? (finishedAt ?? now) : now;
  const elapsed = startedAt ? Math.max(0, end - startedAt) : 0;

  const value = sampler === 'wpm'
    ? Math.round(computeWpm(charsCorrect, elapsed)).toString()
    : sampler === 'acc'
      ? `${(computeAccuracy(charsCorrect, charsTyped) * 100).toFixed(0)}%`
      : String(errors);

  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-80">{label}</p>
      <p className={cn('mt-1 font-serif italic tabular-nums', big ? 'text-5xl' : 'text-3xl')}>
        {value}
      </p>
      <p className="mt-1 font-serif text-[10px] italic opacity-60">handwritten · {new Date().toLocaleDateString()}</p>
    </>
  );
}

function IndexCard({
  title,
  source,
  modeId,
}: {
  title: string;
  source?: string;
  modeId: string;
}) {
  return (
    <div
      className="rounded-sm px-4 py-2 text-right"
      style={{
        background: '#f1e4c5',
        color: '#2a1f12',
        boxShadow: '0 6px 12px -4px rgba(0,0,0,0.55)',
        transform: 'rotate(1.5deg)',
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] opacity-60">
        {modeId} · file no. 042
      </p>
      <p className="font-serif text-sm italic">{title}</p>
      {source && <p className="font-serif text-[10px] italic opacity-60">— {source}</p>}
    </div>
  );
}

function TypoReceipt() {
  const typed = useEngineStore((s) => s.typed);
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);

  const typos: { at: number; expected: string; got: string }[] = [];
  for (let i = 0; i < cursor; i++) {
    if (typed[i] !== target[i]) {
      typos.push({ at: i, expected: target[i], got: typed[i] ?? '·' });
    }
  }

  return (
    <div
      className="relative px-3 pt-3 pb-2 font-mono text-[10px] leading-[1.6] text-[#2a1f12]"
      style={{
        background: '#fbf5e3',
        boxShadow: '0 10px 18px -6px rgba(0,0,0,0.55)',
        clipPath: 'polygon(0 0, 100% 0, 100% 94%, 88% 100%, 74% 94%, 60% 100%, 46% 94%, 32% 100%, 18% 94%, 0 100%)',
      }}
    >
      <p className="text-center font-bold uppercase tracking-[0.3em]">typo log</p>
      <p className="text-center text-[9px] opacity-60">—— session ——</p>
      <div className="mt-1 space-y-0.5">
        {typos.length === 0 && <p className="text-center italic opacity-60">(clean)</p>}
        {typos.slice(-6).map((t, i) => (
          <p key={i} className="flex justify-between gap-2">
            <span>#{String(t.at).padStart(3, '0')}</span>
            <span>
              <span className="opacity-50">{fmt(t.got)}</span>
              {' → '}
              <span className="font-bold">{fmt(t.expected)}</span>
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

function fmt(ch: string) {
  if (ch === ' ') return '␣';
  if (ch === '\n') return '↵';
  if (ch === '\t') return '→';
  return ch;
}

function Calendar({ total, index }: { total: number; index: number }) {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const day = today.getDate();
  return (
    <div
      className="overflow-hidden rounded-sm bg-[#f7ead0] text-center"
      style={{ boxShadow: '0 10px 18px -6px rgba(0,0,0,0.6)' }}
    >
      <div className="bg-[#c85a4a] py-1 font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-white">
        {dayName}
      </div>
      <div className="py-3">
        <p className="font-serif text-4xl font-bold italic text-[#2a1f12]">{day}</p>
      </div>
      <div className="border-t border-[#c4ab6d]/50 py-1 font-mono text-[9px] uppercase tracking-[0.3em] text-[#2a1f12]/70">
        passage {index + 1} / {total}
      </div>
    </div>
  );
}

function Pocketwatch() {
  const status = useEngineStore((s) => s.status);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [status]);

  const end = status === 'finished' ? (finishedAt ?? now) : now;
  const elapsed = startedAt ? Math.max(0, end - startedAt) : 0;
  const secs = Math.floor(elapsed / 1000);
  const angle = (secs % 60) * 6;

  return (
    <div
      className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full"
      style={{
        background: 'radial-gradient(circle at 30% 30%, #e6c07a 0%, #8a6a2a 80%)',
        boxShadow: '0 12px 20px -8px rgba(0,0,0,0.7), inset 0 0 18px rgba(0,0,0,0.35)',
      }}
    >
      <div
        className="flex h-[90px] w-[90px] items-center justify-center rounded-full bg-[#f7ead0]"
        style={{ boxShadow: 'inset 0 0 10px rgba(80,55,20,0.4)' }}
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {[0, 90, 180, 270].map((a) => (
            <line
              key={a}
              x1="50"
              y1="10"
              x2="50"
              y2="18"
              stroke="#2a1f12"
              strokeWidth="2"
              transform={`rotate(${a} 50 50)`}
            />
          ))}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            stroke="#c85a4a"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
            style={{ transition: 'transform 250ms linear' }}
          />
          <circle cx="50" cy="50" r="2.5" fill="#2a1f12" />
        </svg>
      </div>
    </div>
  );
}

function CardStack({
  passages,
  index,
  pickPassage,
}: {
  passages: Array<{ id: string; title: string }>;
  index: number;
  pickPassage: (i: number) => void;
}) {
  return (
    <div className="relative w-full max-w-[200px]">
      <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-[#f1e4c5]/70">
        file cards
      </p>
      <div className="relative h-[140px]">
        {passages.map((p, i) => {
          const offset = i - index;
          const active = i === index;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => pickPassage(i)}
              className={cn(
                'absolute inset-x-0 rounded-sm border border-[#c4ab6d]/60 px-3 py-2 text-left font-serif italic transition-transform',
                active ? 'bg-[#faf2d9] text-[#2a1f12]' : 'bg-[#e6d4a8] text-[#4a3520]/80 hover:bg-[#f1e4c5]',
              )}
              style={{
                top: Math.abs(offset) * 8,
                left: offset * 4,
                transform: `rotate(${offset * 1.5}deg)`,
                zIndex: passages.length - Math.abs(offset),
                boxShadow: active
                  ? '0 14px 24px -8px rgba(0,0,0,0.7)'
                  : '0 6px 12px -4px rgba(0,0,0,0.45)',
              }}
            >
              <p className="font-mono text-[9px] not-italic uppercase tracking-[0.4em] opacity-60">
                card · {String(i + 1).padStart(2, '0')}
              </p>
              <p className="mt-0.5">{p.title}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DeskFooter({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') {
    return (
      <p
        className="text-center font-serif text-sm italic text-[#f1e4c5]/80"
      >
        the notepad is waiting. the raccoon is, allegedly, at lunch.
      </p>
    );
  }
  return (
    <div className="flex justify-center gap-3">
      <button
        type="button"
        onClick={onReset}
        className="rounded-sm bg-[#f1e4c5] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.35em] text-[#2a1f12] shadow-md hover:bg-white"
      >
        Tear page
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-sm bg-[#c85a4a] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.35em] text-white shadow-md hover:bg-[#d86a5a]"
      >
        Next file →
      </button>
    </div>
  );
}
