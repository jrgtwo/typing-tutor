import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useEngineElapsedMs } from '@/hooks/useEngineElapsedMs';
import { useSession } from '@/lib/auth';
import { useDashboard } from '@/lib/queries';
import { DesignNav } from '@/components/DesignNav';
import { RaccoonCameos } from '@/components/mascot/RaccoonCameos';
import { OnScreenKeyboard } from '@/components/typing/OnScreenKeyboard';
import { BetweenSessionsAd } from '@/components/ads/BetweenSessionsAd';
import { SignInButton } from '@/components/auth/SignInButton';
import { StampTray } from '@/components/desk/StampTray';
import {
  // DayPlannerPage, Matchbook, Polaroid, PropertyOfHeader — temporarily
  // hidden while we audit the functional UI. Restore by re-importing.
  GumWrapper,
  StashSticky,
  VinnyCalendar,
} from '@/components/desk/StolenProps';
import { Stamp } from '@/modes/_shared/Stamp';
import { DIFFICULTY_LABEL, type Difficulty, type SessionMode, listModes } from '@/modes';

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

  const { session, loading: authLoading } = useSession();
  const isAuthed = !!session && !authLoading;
  const { data: dashboard } = useDashboard(isAuthed);
  const activeDays = useMemo(() => weeklyActiveDays(dashboard?.sessions), [dashboard]);

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
            className="rounded-full bg-[#f1e4c5]/90 px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.35em] text-[#2a1f12] shadow-md hover:bg-white"
          >
            ◂ leave desk
          </Link>
          <div className="flex items-center gap-3">
            <SignInButton variant="desk" />
          </div>
        </header>

        {/* scatter zone — three columns. The CENTER column stacks the
            stamp tray above the notepad. Sidebars share the grid row so
            their tops align with the stamp tray's top, not the notepad's
            top. */}
        <section className="relative mx-auto grid max-w-[1240px] grid-cols-[300px_minmax(0,1fr)_260px] items-start gap-6 px-6 pb-6">
          {/* LEFT COLUMN — vertical stack top-aligned with stamp tray. */}
          <div className="flex w-full flex-col items-center justify-start gap-5">
            <div style={{ transform: 'rotate(-7deg)' }}>
              <TypoReceipt />
            </div>
            <div style={{ transform: 'rotate(-3deg)' }}>
              <StashSticky color="#ffd66b" rotate={0}>
                <WpmHost />
              </StashSticky>
            </div>
            <div style={{ transform: 'rotate(4deg)' }}>
              <StashSticky color="#9ddaa3" rotate={0}>
                <AccHost />
              </StashSticky>
            </div>
            <div style={{ transform: 'rotate(-4deg)' }}>
              <GumWrapper>
                <ErrHost />
              </GumWrapper>
            </div>
          </div>

          {/* CENTER — stamp tray above the notepad */}
          <div className="mx-auto w-full max-w-[640px]">
            <div className="pb-4">
              <StampTray
                modes={modes}
                activeId={activeMode.id}
                difficulty={difficulty}
                onSelectMode={selectMode}
                onSelectDifficulty={selectDifficulty}
              />
            </div>
            <div
              className="relative"
              style={{ transform: 'rotate(-0.8deg)' }}
            >
              <Notepad
                passage={passage}
                activeMode={activeMode}
                difficulty={difficulty}
              />
            </div>
          </div>

          {/* RIGHT COLUMN — top-aligned with stamp tray. Order:
              calendar, picker stack. The now-playing card was removed and
              its info now lives in the notepad header. */}
          <div className="flex w-full flex-col items-center justify-start gap-6">
            <div style={{ transform: 'rotate(3deg)' }}>
              <VinnyCalendar
                total={passages.length}
                index={index}
                activeDays={isAuthed ? activeDays : undefined}
              />
            </div>
            <div style={{ transform: 'rotate(-2deg)' }}>
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
                <p className="font-mono text-[12px] uppercase tracking-[0.4em] text-[#b7d193]/80">model f · walnut</p>
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
  activeMode,
  difficulty,
}: {
  passage: { title: string; body: string; modeId: string; source?: string };
  activeMode: SessionMode<any, any>;
  difficulty: Difficulty;
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
      <DeskSurface
        passage={passage}
        activeMode={activeMode}
        difficulty={difficulty}
      />
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
// title header is now rich (stamp + title + source + mode meta), so it's
// taller than the old single-line italic.
const TITLE_BLOCK_HEIGHT = 88;
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
  activeMode,
  difficulty,
}: {
  passage: { title: string; body: string; modeId: string; source?: string };
  activeMode: SessionMode<any, any>;
  difficulty: Difficulty;
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
        <div className="mb-4 flex items-center gap-3 border-b border-[#8a6a3a]/40 pb-3">
          <Stamp stamp={activeMode.stamp} scale={0.6} inked />
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-2xl italic leading-tight">
              {passage.title}
            </p>
            {passage.source && (
              <p className="mt-0.5 truncate font-serif text-base italic leading-tight opacity-65">
                — {passage.source}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-[12px] uppercase tracking-[0.35em] opacity-70">
              {activeMode.label} · {DIFFICULTY_LABEL[difficulty].toLowerCase()}
            </p>
            <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.35em] opacity-55">
              file no. 042
            </p>
          </div>
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
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-mono text-[16px] leading-none text-[#2a1f12]/45"
            style={{ bottom: 14 }}
          >
            ▾
          </div>
        )}
        {isCurrent && pages.length > 1 && (
          <div
            className="pointer-events-none absolute font-mono text-[12px] uppercase tracking-[0.3em] text-[#2a1f12]/45"
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
              <div className="mb-4 flex items-center gap-3 border-b border-[#8a6a3a]/40 pb-3">
                <Stamp stamp={activeMode.stamp} scale={0.6} inked />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-2xl italic leading-tight">
                    {snapshotTear.title}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-[12px] uppercase tracking-[0.35em] opacity-70">
                    {activeMode.label} · {DIFFICULTY_LABEL[difficulty].toLowerCase()}
                  </p>
                </div>
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

/**
 * WPM rendered as a sticky-note stat — slapped on the day-planner page.
 */
function WpmHost() {
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const elapsed = useEngineElapsedMs();
  const wpm = Math.round(computeWpm(charsCorrect, elapsed));
  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-80">wpm</p>
      <p className="mt-1 font-serif text-4xl italic tabular-nums leading-none">
        {wpm}
      </p>
    </>
  );
}

/**
 * ACC rendered as a sticky-note stat — same shape as WPM for parity now
 * that the polaroid host is hidden.
 */
function AccHost() {
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const acc = (computeAccuracy(charsCorrect, charsTyped) * 100).toFixed(0);
  return (
    <>
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-80">acc</p>
      <p className="mt-1 font-serif text-4xl italic tabular-nums leading-none">
        {acc}%
      </p>
    </>
  );
}

/**
 * ERR scrawled in ballpoint directly on the foil gum wrapper.
 */
function ErrHost() {
  const errors = useEngineStore((s) => s.errors);
  return (
    <>
      <p
        className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-75"
      >
        slips
      </p>
      <p
        className="mt-1 font-serif italic tabular-nums leading-none"
        style={{
          fontSize: 38,
          color: '#1a1a3a',
          textShadow: '0 0 0.5px rgba(20,20,60,0.4)',
        }}
      >
        {errors}
      </p>
    </>
  );
}

/**
 * Compute which days (0=Sun..6=Sat) of the current local week the user
 * had at least one typing session on, based on each session's `started_at`.
 * Returns undefined when there are no sessions to inspect, so the calendar
 * can render its empty state.
 */
function weeklyActiveDays(
  sessions: Array<{ started_at: string }> | undefined,
): ReadonlySet<number> | undefined {
  if (!sessions || sessions.length === 0) return new Set<number>();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const days = new Set<number>();
  for (const s of sessions) {
    const t = new Date(s.started_at);
    if (Number.isNaN(t.getTime())) continue;
    if (t < weekStart || t >= weekEnd) continue;
    days.add(t.getDay());
  }
  return days;
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
      className="relative px-3.5 pt-3 pb-3 font-mono text-[12px] leading-[1.6] text-[#2a1f12]"
      style={{
        background: '#fbf5e3',
        boxShadow: '0 10px 18px -6px rgba(0,0,0,0.55)',
        clipPath: 'polygon(0 0, 100% 0, 100% 94%, 88% 100%, 74% 94%, 60% 100%, 46% 94%, 32% 100%, 18% 94%, 0 100%)',
        minWidth: 130,
      }}
    >
      <p className="text-center font-bold uppercase tracking-[0.3em]">typo log</p>
      <p className="text-center text-[11px] opacity-60">—— session ——</p>
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

function IntermissionToast() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 20);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
      <div
        className="rounded-sm px-5 py-3 font-mono text-[13px] uppercase tracking-[0.45em] text-[#2a1f12]"
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

  // Build the visible deck: the front card plus a few cards stacked
  // behind. Each is keyed by passage id so they animate position
  // changes when `preview` shifts (instead of unmounting/remounting).
  const visibleDeck: { card: typeof passages[number]; depth: number; idx: number }[] = [];
  for (let d = 0; d < ROLODEX_VISIBLE; d++) {
    const idx = (preview + d) % passages.length;
    visibleDeck.push({ card: passages[idx], depth: d, idx });
  }

  return (
    <div className="relative mx-auto" style={{ width: 240 }}>
      <p className="mb-2 text-center font-mono text-[12px] uppercase tracking-[0.4em] text-[#f1e4c5]/75">
        rolodex
      </p>

      <div className="mb-1 flex justify-center">
        <button
          type="button"
          onClick={() => cycle(-1)}
          aria-label="Previous card"
          className="flex h-6 w-14 items-center justify-center rounded-sm border border-[#c4ab6d]/50 bg-[#2d2218] font-mono text-[12px] text-[#f1e4c5]/85 shadow-sm transition-colors hover:bg-[#3a2c1d] hover:text-[#f1e4c5]"
        >
          ▲
        </button>
      </div>

      {/* CRADLE STAGE — the rolodex binder body holds the deck. The
          cradle base is rendered at the bottom; the spindle bar runs
          horizontally through the middle of the cards (where their
          punched holes sit). Cards keep stable id-based keys so when
          `preview` changes, each card's depth changes and they all
          animate to their new positions together. */}
      <div
        className="relative touch-none"
        onWheel={onWheel}
        style={{
          height: 200,
          perspective: 1100,
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* the deck — render back-to-front so z-stacking is correct */}
        {[...visibleDeck].reverse().map(({ card, depth, idx }) => (
          <RolodexCard
            key={card.id}
            depth={depth}
            cardIndex={idx}
            total={passages.length}
            title={card.title}
            isFront={depth === 0}
            isCommitted={depth === 0 && previewIsCommitted}
            onPick={() => {
              if (depth === 0) {
                pickPassage(idx);
              } else {
                setPreview(idx);
              }
            }}
          />
        ))}

        {/* SPINDLE BAR — horizontal black bar across the middle of the
            cards, visible through their punched holes. Renders ABOVE
            the cards so it appears to pass through them. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-3 right-3"
          style={{
            top: '52%',
            height: 5,
            background:
              'linear-gradient(180deg, #1a0e05 0%, #0a0502 50%, #000 100%)',
            borderRadius: 2,
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
            zIndex: 200,
          }}
        />

        {/* CRADLE BASE — the brown plastic binder body cradling the
            deck. Has two side knob accents and a chunky baseplate. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: 36, zIndex: 220 }}
        >
          {/* baseplate */}
          <div
            className="absolute inset-x-2 bottom-0 rounded-md"
            style={{
              height: 22,
              background:
                'linear-gradient(180deg, #5a3d1c 0%, #3a2510 60%, #1f1408 100%)',
              boxShadow:
                'inset 0 1px 0 rgba(255,210,150,0.25), inset 0 -2px 0 rgba(0,0,0,0.5), 0 6px 10px -3px rgba(0,0,0,0.65)',
            }}
          />
          {/* front lip notch where the active card's bottom slots in */}
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-sm"
            style={{
              bottom: 14,
              width: 70,
              height: 8,
              background:
                'linear-gradient(180deg, #1a0e05 0%, #2a1d12 100%)',
              boxShadow: 'inset 0 2px 3px rgba(0,0,0,0.75)',
            }}
          />
          {/* left knob */}
          <div
            className="absolute"
            style={{
              left: -6,
              bottom: 6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 30%, #6a4820 0%, #2a1d12 80%)',
              boxShadow:
                'inset -1px -1px 2px rgba(0,0,0,0.7), 0 2px 3px rgba(0,0,0,0.6)',
            }}
          />
          {/* right knob */}
          <div
            className="absolute"
            style={{
              right: -6,
              bottom: 6,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background:
                'radial-gradient(circle at 35% 30%, #6a4820 0%, #2a1d12 80%)',
              boxShadow:
                'inset -1px -1px 2px rgba(0,0,0,0.7), 0 2px 3px rgba(0,0,0,0.6)',
            }}
          />
        </div>
      </div>

      <div className="mt-1 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => cycle(1)}
          aria-label="Next card"
          className="flex h-6 w-14 items-center justify-center rounded-sm border border-[#c4ab6d]/50 bg-[#2d2218] font-mono text-[12px] text-[#f1e4c5]/85 shadow-sm transition-colors hover:bg-[#3a2c1d] hover:text-[#f1e4c5]"
        >
          ▼
        </button>
      </div>

      <p className="mt-2 text-center font-mono text-[11px] uppercase tracking-[0.35em] text-[#f1e4c5]/55">
        {String(preview + 1).padStart(2, '0')} / {String(passages.length).padStart(2, '0')}
        {!previewIsCommitted && <span className="ml-2 text-[#e5a042]">· tap to load</span>}
      </p>
    </div>
  );
}

// number of cards visible in the deck (front + cards stacked behind).
const ROLODEX_VISIBLE = 6;

/**
 * One physical card on the rolodex spindle. `depth` is its position in
 * the visible stack — 0 = front (upright, fully visible), >0 = behind
 * the front card, fanned back so its top edge peeks out. Cards keep
 * stable id-based keys so when the previewed card changes, each card's
 * depth changes and CSS transitions animate them all to their new
 * positions in unison — like the physical deck rotating around the
 * binder's spindle.
 */
function RolodexCard({
  depth,
  cardIndex,
  total,
  title,
  isFront,
  isCommitted,
  onPick,
}: {
  depth: number;
  cardIndex: number;
  total: number;
  title: string;
  isFront: boolean;
  isCommitted: boolean;
  onPick: () => void;
}) {
  // back cards lean back at increasing angles, recede in z, and lift
  // slightly so each successive card's top edge fans out above the one
  // in front of it — a real deck of cards on a spindle.
  const rotateX = -10 * depth;
  const ty = -6 * depth;
  const tz = -10 * depth;
  const opacity = isFront ? 1 : Math.max(0.4, 1 - 0.18 * depth);

  return (
    <button
      type="button"
      onClick={onPick}
      tabIndex={depth > 1 ? -1 : 0}
      aria-label={`Card ${cardIndex + 1} of ${total}: ${title}`}
      className="absolute left-3 right-3 rounded-sm border text-left font-serif italic"
      style={{
        // hinge cards around their MIDDLE — that's where the spindle
        // bar passes through. Both halves of the card swing around
        // the same horizontal axis like a real rolodex.
        top: 12,
        bottom: 32,
        background: isFront
          ? isCommitted
            ? '#faf2d9'
            : '#fff7df'
          : '#ead8a8',
        borderColor: isFront
          ? isCommitted
            ? 'rgba(196,171,109,0.7)'
            : 'rgba(229,160,66,0.85)'
          : 'rgba(196,171,109,0.55)',
        color: '#2a1f12',
        transform: `translate3d(0, ${ty}px, ${tz}px) rotateX(${rotateX}deg)`,
        transformOrigin: '50% 50%',
        transformStyle: 'preserve-3d',
        opacity,
        zIndex: 100 - depth,
        transition:
          'transform 380ms cubic-bezier(0.22, 0.85, 0.28, 1), opacity 300ms ease-out, background-color 220ms ease-out, border-color 220ms ease-out',
        boxShadow: isFront
          ? '0 14px 22px -10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.55)'
          : '0 5px 10px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
        cursor: 'pointer',
      }}
    >
      <div className="flex h-full flex-col px-3 pt-2 pb-3">
        <p className="font-mono text-[11px] not-italic uppercase tracking-[0.4em] opacity-60">
          card · {String(cardIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
        <p className="mt-1 flex-1 text-base leading-tight">{title}</p>
      </div>
      {/* punched holes — only on the front card so the spindle bar
          reads cleanly through them. The bar itself is rendered above
          all cards in the stage so it visually passes through. */}
      {isFront && (
        <>
          <span
            aria-hidden
            className="absolute"
            style={{
              left: '32%',
              top: '52%',
              width: 14,
              height: 7,
              borderRadius: 3,
              background: '#1a0e05',
              boxShadow:
                'inset 0 1px 2px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.45)',
            }}
          />
          <span
            aria-hidden
            className="absolute"
            style={{
              right: '32%',
              top: '52%',
              width: 14,
              height: 7,
              borderRadius: 3,
              background: '#1a0e05',
              boxShadow:
                'inset 0 1px 2px rgba(0,0,0,0.85), 0 1px 0 rgba(255,255,255,0.45)',
            }}
          />
        </>
      )}
    </button>
  );
}

function DeskFooter({ onNext, onReset }: { onNext: () => void; onReset: () => void }) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') {
    return (
      <p
        className="text-center font-serif text-base italic text-[#f1e4c5]/85"
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
        className="rounded-sm bg-[#f1e4c5] px-5 py-2.5 font-mono text-[13px] uppercase tracking-[0.35em] text-[#2a1f12] shadow-md hover:bg-white"
      >
        Tear page
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-sm bg-[#c85a4a] px-5 py-2.5 font-mono text-[13px] uppercase tracking-[0.35em] text-white shadow-md hover:bg-[#d86a5a]"
      >
        Next file →
      </button>
    </div>
  );
}
