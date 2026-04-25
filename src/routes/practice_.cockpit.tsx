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

export const Route = createFileRoute('/practice_/cockpit')({
  component: CockpitPractice,
});

const COCKPIT_KBD: React.CSSProperties = {
  ['--color-paper' as any]: '#0b0804',
  ['--color-paper-deep' as any]: '#3a2810',
  ['--color-ink' as any]: '#ffd787',
  ['--color-ink-soft' as any]: '#b5833a',
  ['--color-amber' as any]: '#ffb347',
  ['--color-phosphor' as any]: '#6ade8a',
  ['--color-phosphor-dim' as any]: '#ffd787',
  ['--color-rust' as any]: '#ff5858',
};

/**
 * cockpit: amber HUD, terminal bone structure, a raised armored display
 * for the typing surface flanked by circular gauges. Arcade energy comes
 * from the blinking warning lights and the rising progress arc.
 */
function CockpitPractice() {
  const { passage, passages, index, pickPassage, next, reset } = usePracticeSession();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#060402] text-[#ffd787]">
      <DesignNav />
      <RaccoonCameos />

      {/* subtle amber glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,179,71,0.18), transparent 70%)',
        }}
      />
      {/* scanlines */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background:
            'repeating-linear-gradient(to bottom, rgba(255,215,135,0.05) 0, rgba(255,215,135,0.05) 1px, transparent 1px, transparent 3px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-6">
        {/* top status strip */}
        <header className="flex items-center justify-between border-y-2 border-[#ffb347]/70 bg-[#110b04]/80 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.35em]">
          <Link
            to="/"
            className="text-[#ffd787] hover:text-white"
            style={{ textShadow: '0 0 6px rgba(255,179,71,0.7)' }}
          >
            ◂ rtb
          </Link>
          <div className="flex items-center gap-5 text-[#ffb347]">
            <StatusDot color="#6ade8a" label="sys" />
            <StatusDot color="#ffb347" label="nav" />
            <WarnDot />
            <span style={{ textShadow: '0 0 6px rgba(255,179,71,0.6)' }}>
              {passage.id} · {passage.modeId}
            </span>
          </div>
        </header>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#ffb347]/70">
              objective
            </p>
            <h1
              className="font-mono text-3xl font-black uppercase tracking-[0.2em]"
              style={{
                color: '#ffd787',
                textShadow: '0 0 12px rgba(255,179,71,0.8), 0 0 30px rgba(255,179,71,0.3)',
              }}
            >
              {passage.title}
            </h1>
          </div>
          <Altimeter />
        </div>

        {/* main grid: gauge - hud panel - gauge */}
        <section className="mt-5 grid grid-cols-1 items-center gap-6 md:grid-cols-[140px_1fr_140px]">
          <div className="hidden md:block">
            <Gauge label="WPM" sampler="wpm" ring="#6ade8a" />
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-8 -bottom-6 h-16 blur-3xl"
              style={{ background: 'radial-gradient(ellipse at center, rgba(255,179,71,0.5), transparent 70%)' }}
            />
            <div
              className="relative rounded-lg bg-[#0a0602]/95 p-7"
              style={{
                border: '2px solid #ffb347',
                boxShadow:
                  '0 0 0 1px rgba(255,215,135,0.25), 0 0 30px rgba(255,179,71,0.35), inset 0 0 80px rgba(255,179,71,0.08), 0 5px 0 rgba(58,40,16,0.95), 0 11px 0 rgba(30,20,8,0.95), 0 24px 50px -18px rgba(0,0,0,0.9)',
              }}
            >
              {/* rivets */}
              <Rivet className="left-2 top-2" />
              <Rivet className="right-2 top-2" />
              <Rivet className="left-2 bottom-2" />
              <Rivet className="right-2 bottom-2" />

              <div className="mb-4 flex items-center justify-between text-[10px] uppercase tracking-[0.4em]">
                <span className="text-[#6ade8a]" style={{ textShadow: '0 0 6px rgba(106,222,138,0.8)' }}>
                  ● display / a1
                </span>
                <ProgressPill />
              </div>
              <CockpitSurface />
            </div>
          </div>

          <div className="hidden md:block">
            <Gauge label="ACC" sampler="acc" ring="#ffb347" />
          </div>
        </section>

        <CockpitScoreboard />

        <CockpitFooter onNext={next} onReset={reset} />

        <BetweenSessionsAd />

        <section className="mt-8">
          <p
            className="mb-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#ffb347]/80"
            style={{ textShadow: '0 0 6px rgba(255,179,71,0.5)' }}
          >
            flight plan — select leg
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
                      ? 'border-[#ffd787] bg-[#ffb347]/15 text-[#ffd787]'
                      : 'border-[#ffb347]/30 text-[#ffd787]/80 hover:border-[#ffb347] hover:text-[#ffd787]',
                  )}
                  style={
                    active
                      ? { boxShadow: '0 0 14px rgba(255,179,71,0.55)', textShadow: '0 0 8px rgba(255,215,135,0.8)' }
                      : undefined
                  }
                >
                  <span className="block text-[9px] opacity-60 text-[#6ade8a]">wp·{String(i + 1).padStart(2, '0')}</span>
                  <span className="mt-0.5 block font-bold">{p.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-6 rounded-lg border-2 border-[#ffb347]/40 bg-[#0a0602]/80 p-3" style={COCKPIT_KBD}>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.4em] text-[#ffb347]" style={{ textShadow: '0 0 6px rgba(255,179,71,0.7)' }}>
            ▸ control yoke
          </p>
          <OnScreenKeyboard />
        </div>
      </div>
    </main>
  );
}

function CockpitSurface() {
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
                color: '#060402',
                background: '#ffd787',
                boxShadow: '0 0 16px rgba(255,215,135,0.95)',
              }}
            >
              {ch === '\n' ? '↵\n' : ch}
            </span>
          );
        }
        if (past && ok) {
          return (
            <span key={i} className="text-[#ffd787]" style={{ textShadow: '0 0 6px rgba(255,179,71,0.7)' }}>
              {ch}
            </span>
          );
        }
        if (past && !ok) {
          return (
            <span
              key={i}
              className="text-[#ff5858]"
              style={{ textShadow: '0 0 10px rgba(255,88,88,0.9)', background: 'rgba(255,88,88,0.2)' }}
            >
              {ch === ' ' ? '▓' : ch}
            </span>
          );
        }
        return <span key={i} className="text-[#ffd787]/25">{ch}</span>;
      })}
    </div>
  );
}

function StatusDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span style={{ color }}>{label}</span>
    </span>
  );
}

function WarnDot() {
  const errors = useEngineStore((s) => s.errors);
  const status = useEngineStore((s) => s.status);
  const warn = errors > 0 && status === 'running';
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn('h-1.5 w-1.5 rounded-full', warn && 'caret-blink')}
        style={{
          background: warn ? '#ff5858' : '#4a2020',
          boxShadow: warn ? '0 0 10px rgba(255,88,88,0.9)' : undefined,
        }}
      />
      <span style={{ color: warn ? '#ff5858' : '#4a2020' }}>wrn</span>
    </span>
  );
}

function Rivet({ className }: { className?: string }) {
  return (
    <span
      className={cn('absolute h-2 w-2 rounded-full', className)}
      style={{
        background: 'radial-gradient(circle at 30% 30%, #ffd787, #6a4a1a 70%)',
        boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.8)',
      }}
    />
  );
}

function ProgressPill() {
  const cursor = useEngineStore((s) => s.cursor);
  const target = useEngineStore((s) => s.target);
  const pct = target.length ? Math.round((cursor / target.length) * 100) : 0;
  return (
    <span
      className="rounded-full border border-[#ffb347]/70 bg-[#110b04] px-2 py-0.5 font-mono text-[10px] tabular-nums"
      style={{ color: '#ffb347', textShadow: '0 0 6px rgba(255,179,71,0.7)' }}
    >
      {String(pct).padStart(3, '0')}%
    </span>
  );
}

function Gauge({ label, sampler, ring }: { label: string; sampler: 'wpm' | 'acc'; ring: string }) {
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);

  const elapsed = useEngineElapsedMs(200);
  const raw = sampler === 'wpm' ? computeWpm(charsCorrect, elapsed) : computeAccuracy(charsCorrect, charsTyped) * 100;
  const pct = sampler === 'wpm' ? Math.min(100, (raw / 120) * 100) : raw;
  const value = sampler === 'wpm' ? Math.round(raw).toString() : `${raw.toFixed(0)}%`;
  const angle = (pct / 100) * 270 - 135; // -135..+135 sweep

  return (
    <div className="mx-auto flex flex-col items-center">
      <div className="relative h-[120px] w-[120px]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="50" cy="50" r="42" fill="#0a0602" stroke={`${ring}55`} strokeWidth="2" />
          <path
            d="M 50 50 L 50 10"
            stroke={`${ring}22`}
            strokeWidth="3"
            transform="rotate(-135 50 50)"
          />
          <path
            d={describeArc(50, 50, 38, -135, -135 + (pct / 100) * 270)}
            stroke={ring}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${ring})` }}
          />
          {/* needle */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="18"
            stroke={ring}
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
            style={{ filter: `drop-shadow(0 0 4px ${ring})`, transition: 'transform 200ms ease-out' }}
          />
          <circle cx="50" cy="50" r="3" fill={ring} />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-4">
          <p
            className="font-mono text-xl font-black tabular-nums leading-none"
            style={{ color: ring, textShadow: `0 0 8px ${ring}` }}
          >
            {value}
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.4em]" style={{ color: `${ring}99` }}>
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = polar(cx, cy, r, endDeg);
  const end = polar(cx, cy, r, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function Altimeter() {
  const elapsed = useEngineElapsedMs();
  return (
    <div className="rounded border border-[#ffb347]/60 bg-[#110b04]/80 px-3 py-1.5 text-right font-mono" style={{ boxShadow: 'inset 0 0 12px rgba(255,179,71,0.15)' }}>
      <p className="text-[9px] uppercase tracking-[0.4em] text-[#ffb347]/70">elapsed</p>
      <p className="text-xl tabular-nums text-[#ffd787]" style={{ textShadow: '0 0 8px rgba(255,215,135,0.8)' }}>
        {fmt(elapsed)}
      </p>
    </div>
  );
}

function CockpitScoreboard() {
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const elapsed = useEngineElapsedMs(200);
  const wpm = computeWpm(charsCorrect, elapsed);
  const acc = computeAccuracy(charsCorrect, charsTyped);

  return (
    <div className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
      <Tile label="WPM" value={Math.round(wpm).toString().padStart(3, '0')} color="#6ade8a" />
      <Tile label="ACC" value={`${(acc * 100).toFixed(0)}%`} color="#ffb347" />
      <Tile label="HITS" value={String(charsCorrect).padStart(4, '0')} color="#ffd787" />
      <Tile label="WRN" value={String(errors).padStart(2, '0')} color={errors ? '#ff5858' : '#6ade8a'} />
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="rounded border-2 bg-[#0a0602]/80 px-3 py-2 text-center"
      style={{
        borderColor: `${color}55`,
        boxShadow: `inset 0 0 12px ${color}14, 0 0 10px ${color}22`,
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.4em]" style={{ color: `${color}cc` }}>
        {label}
      </p>
      <p
        className="mt-0.5 font-mono text-xl font-black tabular-nums"
        style={{ color, textShadow: `0 0 8px ${color}` }}
      >
        {value}
      </p>
    </div>
  );
}

function CockpitFooter({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') {
    return (
      <p
        className="mt-6 text-center font-mono text-xs uppercase tracking-[0.5em] text-[#ffb347] caret-blink"
        style={{ textShadow: '0 0 8px rgba(255,179,71,0.9)' }}
      >
        ▸ cleared for takeoff
      </p>
    );
  }
  return (
    <div className="mt-6 flex justify-center gap-3">
      <button
        type="button"
        onClick={onReset}
        className="rounded border-2 border-[#6ade8a] bg-[#6ade8a]/10 px-5 py-2 font-mono text-xs uppercase tracking-[0.35em] text-[#6ade8a] hover:bg-[#6ade8a]/20"
        style={{ boxShadow: '0 0 14px rgba(106,222,138,0.5)', textShadow: '0 0 8px rgba(106,222,138,0.9)' }}
      >
        Retry approach
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded border-2 border-[#ffb347] bg-[#ffb347]/15 px-5 py-2 font-mono text-xs uppercase tracking-[0.35em] text-[#ffd787] hover:bg-[#ffb347]/25"
        style={{ boxShadow: '0 0 16px rgba(255,179,71,0.6)', textShadow: '0 0 8px rgba(255,215,135,0.9)' }}
      >
        Next waypoint ▸
      </button>
    </div>
  );
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
