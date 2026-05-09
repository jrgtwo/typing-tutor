import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useEngineElapsedMs } from '@/hooks/useEngineElapsedMs';
import { DesignNav } from '@/components/DesignNav';
import { RaccoonCameos } from '@/components/mascot/RaccoonCameos';
import { OnScreenKeyboard } from '@/components/typing/OnScreenKeyboard';
import { BetweenSessionsAd } from '@/components/ads/BetweenSessionsAd';
import { SignInButton } from '@/components/auth/SignInButton';
import { StampTray } from '@/components/desk/StampTray';
import { StampedMode } from '@/components/desk/StampedMode';
import { listModes } from '@/modes';
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
  const {
    passage,
    passages,
    index,
    pickPassage,
    next,
    reset,
    activeMode,
    difficulty,
    selectMode,
    selectDifficulty,
    modeState,
    effectiveConfig,
    sessionDone,
    intermission,
    finalScore,
    elapsedMs,
  } = usePracticeSession();
  const modes = listModes();
  const HudComponent = activeMode.HudComponent;
  const EndScreenComponent = activeMode.EndScreenComponent;

  return (
    <main
      className="relative min-h-screen overflow-hidden text-[#2a1f12]"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 50% 45%, #3a2614 0%, #1d130a 80%)',
      }}
    >
      <DesignNav />
      <RaccoonCameos />

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
        <header className="flex items-center justify-between gap-3 px-6 py-4">
          <Link
            to="/"
            className="rounded-full bg-[#f1e4c5]/90 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#2a1f12] shadow-md hover:bg-white"
          >
            ◂ leave desk
          </Link>
          <div className="flex items-center gap-3">
            <SignInButton variant="desk" />
            <IndexCard
              title={passage.title}
              source={passage.source}
              activeMode={activeMode}
              difficulty={difficulty}
            />
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 pb-2">
          <StampTray
            modes={modes}
            activeId={activeMode.id}
            difficulty={difficulty}
            onSelectMode={selectMode}
            onSelectDifficulty={selectDifficulty}
          />
        </div>

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

          {/* mode-owned HUD slot — Practice renders the count-up pocketwatch,
              Race the Clock renders a countdown, Survival renders strike balls.
              Position is owned by the HUD component itself so each mode picks
              where on the desk its HUD lives. */}
          <HudComponent
            state={modeState}
            difficulty={effectiveConfig}
            elapsedMs={elapsedMs}
          />
        </section>

        {intermission && <IntermissionToast />}

        {sessionDone && finalScore && EndScreenComponent && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center px-6"
            style={{
              background:
                'radial-gradient(ellipse 70% 55% at 50% 45%, rgba(20,12,6,0.55) 0%, rgba(10,5,2,0.85) 80%)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <EndScreenComponent
              score={finalScore}
              state={modeState}
              difficulty={effectiveConfig}
              onReset={reset}
              onNext={next}
            />
          </div>
        )}

        {/* footer — actions */}
        <div className="relative px-6 pb-6 pt-2">
          {!sessionDone && <DeskFooter onNext={next} onReset={reset} />}

          <BetweenSessionsAd />

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
      className="relative rounded-sm"
      style={{
        // dark cardboard backing visible only briefly during a tear, since
        // the page sheets cover the whole article inner area.
        backgroundColor: '#3d2a14',
        boxShadow:
          '0 3px 0 #d8c28a, 0 6px 0 #c4ab6d, 0 30px 50px -10px rgba(0,0,0,0.6), 0 60px 80px -20px rgba(0,0,0,0.5)',
        color: '#2a1f12',
      }}
    >
      {/* spiral binding bar — z-50 so it stays above tearing sheets */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-8 rounded-t-sm"
        style={{
          zIndex: 50,
          background: 'linear-gradient(180deg, #6a4820 0%, #3d2a14 100%)',
          boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,140,0.2)',
        }}
      />
      {/* holes in the binding */}
      <div
        className="pointer-events-none absolute inset-x-0 top-2 flex justify-around px-8"
        style={{ zIndex: 50 }}
      >
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

      {/* the actual paper sheets — each one fills the full notepad and
          tears as a single piece of paper */}
      <DeskSurface passage={passage} />
    </article>
  );
}

const PAGE_HEIGHT = 270;
const TEAR_DURATION_MS = 320;
// when the cursor is within this many chars of the page end, start
// pre-lifting the page so the actual tear has less work to do.
const ANTICIPATE_WINDOW = 18;
// dimensions of the full sheet (which IS the visible notepad paper)
const SHEET_PAD_TOP = 56;    // matches old article pt-14, clears binding
const SHEET_PAD_X = 40;      // matches old article pl-10/pr-10
const SHEET_PAD_BOTTOM = 40; // matches old article pb-10
const TITLE_BLOCK_HEIGHT = 44;
const NOTEPAD_HEIGHT =
  SHEET_PAD_TOP + TITLE_BLOCK_HEIGHT + PAGE_HEIGHT + SHEET_PAD_BOTTOM;
const SHEET_PAPER_BG: React.CSSProperties = {
  backgroundColor: '#faf2d9',
  backgroundImage:
    'repeating-linear-gradient(0deg, rgba(90,70,40,0.08) 0 1px, transparent 1px 32px), linear-gradient(180deg, #faf2d9 0%, #efdfb3 100%)',
};

function renderChar(
  ch: string,
  i: number,
  cursor: number,
  typed: string,
  status: string,
) {
  const past = i < cursor;
  const current = i === cursor && status !== 'finished';
  const ok = past && typed[i] === ch;
  // always render the same visible glyph the measurement layer sees, so
  // wrapping never diverges between measure and visible (otherwise an
  // error at the end of a line can shift content past the page bottom).
  const display = ch === '\n' ? '¶\n' : ch;

  if (current) {
    return (
      <span
        key={i}
        className="caret-blink"
        style={{
          background: '#2a1f12',
          color: '#faf2d9',
          boxShadow: '0 0 0 2px #2a1f12',
          borderRadius: 2,
        }}
      >
        {display}
      </span>
    );
  }
  if (past && ok) {
    return (
      <span key={i} style={{ color: '#2a1f12' }}>
        {display}
      </span>
    );
  }
  if (past && !ok) {
    // error on whitespace — flag with a red background tint instead of
    // swapping the glyph (which would change wrap width).
    if (ch === ' ' || ch === '\n') {
      return (
        <span
          key={i}
          style={{
            color: '#c85a4a',
            backgroundColor: 'rgba(200, 90, 74, 0.32)',
            boxShadow: 'inset 0 0 0 1px rgba(200, 90, 74, 0.55)',
            borderRadius: 2,
          }}
        >
          {display}
        </span>
      );
    }
    return (
      <span
        key={i}
        style={{
          color: '#c85a4a',
          textDecoration: 'line-through wavy #c85a4a',
        }}
      >
        {display}
      </span>
    );
  }
  return (
    <span key={i} style={{ color: 'rgba(42,31,18,0.35)' }}>
      {display}
    </span>
  );
}

function DeskSurface({
  passage,
}: {
  passage: { title: string; body: string; modeId: string };
}) {
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const status = useEngineStore((s) => s.status);

  const measureRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<{ start: number; offsetTop: number }[]>([
    { start: 0, offsetTop: 0 },
  ]);

  useLayoutEffect(() => {
    const recompute = () => {
      const node = measureRef.current;
      if (!node) return;
      const spans = Array.from(node.querySelectorAll<HTMLSpanElement>('[data-i]'));
      if (spans.length === 0) {
        setPages([{ start: 0, offsetTop: 0 }]);
        return;
      }
      const result: { start: number; offsetTop: number }[] = [{ start: 0, offsetTop: 0 }];
      let pageOffset = 0;
      for (let i = 0; i < spans.length; i++) {
        const top = spans[i].offsetTop;
        if (top - pageOffset >= PAGE_HEIGHT) {
          result.push({ start: i, offsetTop: top });
          pageOffset = top;
        }
      }
      setPages(result);
    };
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [target]);

  // page that contains the cursor
  let currentPage = 0;
  for (let p = pages.length - 1; p >= 0; p--) {
    if (cursor >= pages[p].start) {
      currentPage = p;
      break;
    }
  }

  // when currentPage advances, kick off a tear animation on the page being left
  const [tearing, setTearing] = useState<number | null>(null);
  const prevPageRef = useRef(currentPage);
  useEffect(() => {
    const prev = prevPageRef.current;
    if (currentPage > prev) {
      setTearing(prev);
      const t = window.setTimeout(() => setTearing(null), TEAR_DURATION_MS);
      prevPageRef.current = currentPage;
      return () => window.clearTimeout(t);
    }
    // moving backward (new passage, reset, etc.) — no internal tear; the
    // snapshot tear below handles the visual transition instead.
    prevPageRef.current = currentPage;
    setTearing(null);
  }, [currentPage]);

  // Snapshot tearing: any time the passage swaps (next file / pick file)
  // OR the cursor jumps back to 0 within the same passage (Tear page reset),
  // we want the previously visible sheet to physically tear off, revealing
  // the freshly loaded content underneath.
  type Snapshot = { chars: string[]; title: string };
  const [snapshotTear, setSnapshotTear] = useState<Snapshot | null>(null);
  const visibleSnapshotRef = useRef<Snapshot>({ chars: [], title: passage.title });
  const prevTargetRef = useRef(target);
  const prevCursorRef = useRef(cursor);

  useEffect(() => {
    const targetChanged = target !== prevTargetRef.current;
    const wasReset =
      !targetChanged && cursor === 0 && prevCursorRef.current > 0;
    if (targetChanged || wasReset) {
      // capture the OLD sheet (the ref still holds the previous render's
      // visible slice — see the ref-update effect below)
      setSnapshotTear(visibleSnapshotRef.current);
      setTearing(null);
      const t = window.setTimeout(() => setSnapshotTear(null), TEAR_DURATION_MS);
      prevTargetRef.current = target;
      prevCursorRef.current = cursor;
      return () => window.clearTimeout(t);
    }
    prevTargetRef.current = target;
    prevCursorRef.current = cursor;
  }, [target, cursor]);

  // keep visibleSnapshotRef pointing at the current sheet's content. runs
  // AFTER the detection effect above so the detection effect always reads
  // the previous render's value.
  //
  // IMPORTANT: only refresh the ref when target matches passage.body —
  // i.e., when the engine has caught up to the new passage prop. There's
  // a one-render window after pickPassage where passage.title is the
  // NEW title but target still holds the OLD body; updating the ref in
  // that window would mismatch the chars (still old) with the title
  // (already new), so the snapshot tear would render the new title over
  // the old chars.
  useEffect(() => {
    if (target !== passage.body) return;
    const startI = pages[currentPage]?.start ?? 0;
    const endI = pages[currentPage + 1]?.start ?? chars.length;
    visibleSnapshotRef.current = {
      chars: chars.slice(startI, endI),
      title: passage.title,
    };
  });

  const chars = Array.from(target);
  const hasNext = currentPage < pages.length - 1;

  const renderSheet = (idx: number) => {
    const startI = pages[idx].start;
    const endI = pages[idx + 1]?.start ?? chars.length;
    const isTearing = tearing === idx;
    const isCurrent = currentPage === idx;

    // pre-tear "anticipation" — only on the live current page when there
    // is a next page to flip to. Ramps from 0 → 1 over the last
    // ANTICIPATE_WINDOW chars; the resulting pose matches the tear-off
    // keyframe's 0% so the handoff is seamless.
    const hasFollowingPage = idx + 1 < pages.length;
    let anticipation = 0;
    if (isCurrent && !isTearing && hasFollowingPage && status !== 'finished') {
      const charsLeft = endI - cursor;
      if (charsLeft >= 0 && charsLeft <= ANTICIPATE_WINDOW) {
        anticipation = 1 - charsLeft / ANTICIPATE_WINDOW;
      }
    }
    // anticipation now uses ONLY a tiny downward translate (no skew) so
    // the start of the tear animation doesn't include any rise/fall as
    // a skew releases. Keyframe 0% matches this for a seamless handoff.
    const anticipationStyle: React.CSSProperties =
      anticipation > 0
        ? {
            transform: `translate(0, ${(2 * anticipation).toFixed(2)}px)`,
            transformOrigin: '0% 0%',
            transition: 'transform 90ms ease-out',
          }
        : { transition: 'transform 140ms ease-out' };

    const innerContent = (
      <div
        style={{
          paddingTop: SHEET_PAD_TOP,
          paddingLeft: SHEET_PAD_X,
          paddingRight: SHEET_PAD_X,
          paddingBottom: SHEET_PAD_BOTTOM,
        }}
      >
        <div className="mb-4 border-b border-[#8a6a3a]/40 pb-2 font-serif italic">
          <span className="text-sm">— {passage.title} —</span>
        </div>
        <div
          className="overflow-hidden whitespace-pre-wrap break-words font-mono text-[19px] leading-[30px] tracking-[0.02em]"
          style={{ height: PAGE_HEIGHT }}
        >
          {chars
            .slice(startI, endI)
            .map((ch, j) => renderChar(ch, startI + j, cursor, typed, status))}
        </div>
      </div>
    );

    if (isTearing) {
      // wrapper carries the slide-off + drop-shadow; the two children
      // animate their own clip-paths in sync to make the diagonal fold.
      return (
        <div
          key={idx}
          className="notepad-sheet--tearing absolute inset-0 rounded-sm"
          style={{ zIndex: 30 }}
        >
          <div
            className="notepad-sheet--tearing-base absolute inset-0 rounded-sm"
            style={SHEET_PAPER_BG}
          >
            {innerContent}
          </div>
          <div
            className="notepad-sheet--tearing-flap absolute inset-0 rounded-sm"
            aria-hidden
          />
        </div>
      );
    }

    return (
      <div
        key={idx}
        className="absolute inset-0 rounded-sm"
        style={{
          ...SHEET_PAPER_BG,
          ...anticipationStyle,
          zIndex: isCurrent ? 20 : 10,
        }}
      >
        {innerContent}

        {/* per-sheet indicators — only on the current, non-tearing sheet */}
        {isCurrent && hasNext && (
          <div
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-mono text-[14px] leading-none text-[#2a1f12]/45"
            style={{ bottom: 14 }}
          >
            ▾
          </div>
        )}
        {isCurrent && pages.length > 1 && (
          <div
            className="pointer-events-none absolute font-mono text-[10px] uppercase tracking-[0.3em] text-[#2a1f12]/40"
            style={{ bottom: 14, right: 16 }}
          >
            {String(currentPage + 1).padStart(2, '0')}/{String(pages.length).padStart(2, '0')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="relative w-full"
      style={{
        height: NOTEPAD_HEIGHT,
        // close perspective for dramatic foreshortening — makes the page
        // look like it's being lifted off the pad rather than rotating
        // flat. Couple this with translateZ on the tearing keyframe.
        perspective: 700,
        perspectiveOrigin: '50% 100%',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* hidden layer — measures where lines wrap so we know page boundaries.
          width matches the visible text (sheet width minus side padding). */}
      <div
        ref={measureRef}
        aria-hidden
        className="invisible pointer-events-none absolute whitespace-pre-wrap break-words font-mono text-[19px] leading-[30px] tracking-[0.02em]"
        style={{ left: SHEET_PAD_X, right: SHEET_PAD_X, top: 0 }}
      >
        {chars.map((ch, i) => (
          <span key={i} data-i={i}>
            {ch === '\n' ? '¶\n' : ch}
          </span>
        ))}
      </div>

      {/* the pad: render the live sheet plus the one being torn (if any).
          when the live sheet tears, the next-current sheet sits beneath it
          at z-20 so it's revealed as the torn sheet rips away. */}
      {renderSheet(currentPage)}
      {tearing !== null && tearing !== currentPage && renderSheet(tearing)}

      {/* snapshot tear — for passage swaps and resets. the OLD content
          rides on top with the diagonal-fold animation; the freshly
          loaded content renders underneath as the new currentPage. */}
      {snapshotTear && (
        <div
          className="notepad-sheet--tearing absolute inset-0 rounded-sm"
          style={{ zIndex: 35 }}
        >
          <div
            className="notepad-sheet--tearing-base absolute inset-0 rounded-sm"
            style={SHEET_PAPER_BG}
          >
            <div
              style={{
                paddingTop: SHEET_PAD_TOP,
                paddingLeft: SHEET_PAD_X,
                paddingRight: SHEET_PAD_X,
                paddingBottom: SHEET_PAD_BOTTOM,
              }}
            >
              <div className="mb-4 border-b border-[#8a6a3a]/40 pb-2 font-serif italic">
                <span className="text-sm">— {snapshotTear.title} —</span>
              </div>
              <div
                className="overflow-hidden whitespace-pre-wrap break-words font-mono text-[19px] leading-[30px] tracking-[0.02em]"
                style={{ height: PAGE_HEIGHT, color: '#2a1f12' }}
              >
                {snapshotTear.chars.map((ch, j) => (
                  <span key={j}>{ch === '\n' ? '¶\n' : ch}</span>
                ))}
              </div>
            </div>
          </div>
          <div
            className="notepad-sheet--tearing-flap absolute inset-0 rounded-sm"
            aria-hidden
          />
        </div>
      )}
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
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const elapsed = useEngineElapsedMs();

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
  activeMode,
  difficulty,
}: {
  title: string;
  source?: string;
  activeMode: import('@/modes').SessionMode<any, any>;
  difficulty: import('@/modes').Difficulty;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-sm px-4 py-2 text-right"
      style={{
        background: '#f1e4c5',
        color: '#2a1f12',
        boxShadow: '0 6px 12px -4px rgba(0,0,0,0.55)',
        transform: 'rotate(1.5deg)',
      }}
    >
      <StampedMode mode={activeMode} difficulty={difficulty} />
      <div>
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] opacity-60">
          file no. 042
        </p>
        <p className="font-serif text-sm italic">{title}</p>
        {source && <p className="font-serif text-[10px] italic opacity-60">— {source}</p>}
      </div>
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
        {Array.from({ length: 6 }).map((_, i) => {
          const recent = typos.slice(-6);
          const t = recent[i];
          if (!t) {
            if (i === 0 && typos.length === 0) {
              return (
                <p key={i} className="text-center italic opacity-60">
                  (clean)
                </p>
              );
            }
            return (
              <p key={i} aria-hidden className="invisible">
                &nbsp;
              </p>
            );
          }
          return (
            <p key={i} className="flex justify-between gap-2">
              <span>#{String(t.at).padStart(3, '0')}</span>
              <span>
                <span className="opacity-50">{fmt(t.got)}</span>
                {' → '}
                <span className="font-bold">{fmt(t.expected)}</span>
              </span>
            </p>
          );
        })}
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

function IntermissionToast() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 20);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
      <div
        className="rounded-sm px-5 py-3 font-mono text-[11px] uppercase tracking-[0.45em] text-[#2a1f12]"
        style={{
          background: 'linear-gradient(180deg, #faf2d9 0%, #efdfb3 100%)',
          boxShadow: '0 16px 32px -10px rgba(0,0,0,0.6), 0 3px 0 #d8c28a',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.94)',
          transition: 'opacity 160ms ease-out, transform 240ms cubic-bezier(0.2,0.9,0.3,1)',
        }}
      >
        ✓ next file
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
  const [preview, setPreview] = useState(index);
  const lastWheel = useRef(0);

  useEffect(() => {
    setPreview(index);
  }, [index]);

  const cycle = (dir: 1 | -1) => {
    setPreview((p) => (p + dir + passages.length) % passages.length);
  };

  const onWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheel.current < 180) return;
    lastWheel.current = now;
    cycle(e.deltaY > 0 ? 1 : -1);
  };

  const previewIsCommitted = preview === index;

  return (
    <div className="relative w-full max-w-[200px]">
      <p className="mb-2 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-[#f1e4c5]/70">
        file cards
      </p>

      <div className="mb-1 flex justify-center">
        <button
          type="button"
          onClick={() => cycle(-1)}
          aria-label="Previous card"
          className="flex h-5 w-12 items-center justify-center rounded-sm border border-[#c4ab6d]/50 bg-[#2d2218] font-mono text-[10px] text-[#f1e4c5]/80 shadow-sm transition-colors hover:bg-[#3a2c1d] hover:text-[#f1e4c5]"
        >
          ▲
        </button>
      </div>

      <div
        className="relative h-[140px] touch-none"
        onWheel={onWheel}
      >
        {passages.map((p, i) => {
          const offset = i - preview;
          const active = i === preview;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => pickPassage(i)}
              className={cn(
                'absolute inset-x-0 rounded-sm border px-3 py-2 text-left font-serif italic transition-all duration-300 ease-out',
                active
                  ? previewIsCommitted
                    ? 'border-[#c4ab6d]/60 bg-[#faf2d9] text-[#2a1f12]'
                    : 'border-[#e5a042]/80 bg-[#faf2d9] text-[#2a1f12]'
                  : 'border-[#c4ab6d]/60 bg-[#e6d4a8] text-[#4a3520]/80',
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

      <div className="mt-1 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => cycle(1)}
          aria-label="Next card"
          className="flex h-5 w-12 items-center justify-center rounded-sm border border-[#c4ab6d]/50 bg-[#2d2218] font-mono text-[10px] text-[#f1e4c5]/80 shadow-sm transition-colors hover:bg-[#3a2c1d] hover:text-[#f1e4c5]"
        >
          ▼
        </button>
      </div>

      <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-[#f1e4c5]/50">
        {String(preview + 1).padStart(2, '0')} / {String(passages.length).padStart(2, '0')}
        {!previewIsCommitted && <span className="ml-2 text-[#e5a042]">· tap to load</span>}
      </p>
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
