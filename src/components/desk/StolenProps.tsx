import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// jagged "torn" edge along the LEFT side of an element. The element sits
// flush at the right, but the left edge is bitten in irregularly.
const TORN_LEFT_EDGE =
  'polygon(8% 0%, 100% 0%, 100% 100%, 6% 100%, 10% 92%, 4% 84%, 11% 74%, 5% 66%, 9% 58%, 3% 50%, 10% 42%, 4% 34%, 11% 24%, 5% 16%, 9% 8%)';

// jagged top-right "raccoon bite" out of the polaroid.
const POLAROID_BITE =
  'polygon(0% 0%, 76% 0%, 78% 6%, 84% 4%, 88% 10%, 94% 8%, 100% 14%, 100% 100%, 0% 100%)';

// gum-wrapper: torn on top and bottom, narrow rectangle.
const FOIL_TORN =
  'polygon(0% 6%, 6% 2%, 14% 5%, 22% 1%, 32% 4%, 44% 0%, 56% 3%, 68% 1%, 80% 5%, 90% 2%, 100% 6%, 98% 92%, 92% 96%, 84% 93%, 74% 98%, 62% 94%, 50% 99%, 38% 95%, 26% 98%, 16% 94%, 6% 97%, 0% 93%)';

// foil silver gradient — fakes brushed metal with vertical highlights.
const FOIL_BG: CSSProperties = {
  background:
    'linear-gradient(180deg, #cdd0d4 0%, #f3f4f6 18%, #b9bcc1 35%, #e6e8eb 55%, #9ea1a6 75%, #d6d8dc 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 4px)',
  backgroundBlendMode: 'overlay',
};

/**
 * Day-planner page — torn out of someone else's planner. Pre-printed date,
 * stamped name, ghost lines from a real day. Hosts the WPM sticky on top.
 */
export function DayPlannerPage({ children }: { children?: ReactNode }) {
  return (
    <div
      className="relative w-[210px]"
      style={{
        clipPath: TORN_LEFT_EDGE,
        background:
          'linear-gradient(180deg, #f5e9c8 0%, #ead9a8 100%), repeating-linear-gradient(0deg, rgba(110,80,40,0.08) 0 1px, transparent 1px 24px)',
        backgroundBlendMode: 'multiply',
        boxShadow:
          '0 18px 30px -12px rgba(0,0,0,0.7), 0 4px 0 rgba(120,90,50,0.25)',
        color: '#2a1f12',
      }}
    >
      <div className="px-5 pl-7 pt-3 pb-4">
        {/* faded "L. KOWALSKI" stamp */}
        <p
          className="text-[8px] uppercase tracking-[0.4em]"
          style={{
            fontFamily: 'ui-serif, serif',
            color: 'rgba(80,40,80,0.55)',
            letterSpacing: '0.45em',
          }}
        >
          ⌧ L. Kowalski
        </p>
        {/* pre-printed date */}
        <div className="mt-1 flex items-baseline justify-between border-b border-[#8a6a3a]/40 pb-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-70">
            mar 14
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] opacity-55">
            tue
          </p>
        </div>

        {/* ghost handwritten lines, two crossed out */}
        <ul className="mt-2 space-y-1 font-serif text-[10px] italic leading-[1.3]">
          <li className="relative opacity-60">
            <span className="line-through decoration-[#5a3a20]/60 decoration-1">
              call vet re: fluffy
            </span>
          </li>
          <li className="relative opacity-60">
            <span className="line-through decoration-[#5a3a20]/60 decoration-1">
              return library books
            </span>
          </li>
          <li className="opacity-50">3pm — pickup at saul's</li>
        </ul>

        {/* WPM sticky lives here */}
        <div className="mt-2 flex justify-center">{children}</div>
      </div>
    </div>
  );
}

/**
 * Sticky-note style square hosting a stat — slapped on top of the planner.
 */
export function StashSticky({
  color,
  children,
  rotate = 0,
}: {
  color: string;
  children: ReactNode;
  rotate?: number;
}) {
  return (
    <div
      className="relative w-[130px] p-3 text-center text-[#2a1f12]"
      style={{
        background: color,
        boxShadow:
          '0 10px 16px -6px rgba(0,0,0,0.55), inset 0 -10px 12px -10px rgba(0,0,0,0.18), inset 0 2px 0 rgba(255,255,255,0.4)',
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
      {/* tape strip on top */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-2 h-3 w-10 -translate-x-1/2"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,250,230,0.7) 0%, rgba(220,210,180,0.55) 100%)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
        }}
      />
    </div>
  );
}

/**
 * Polaroid — chewed corner, coffee ring, handwritten value below. Hosts ACC.
 */
export function Polaroid({ children }: { children?: ReactNode }) {
  return (
    <div
      className="relative w-[150px]"
      style={{
        background: '#f8efd9',
        clipPath: POLAROID_BITE,
        boxShadow:
          '0 14px 22px -8px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(0,0,0,0.04)',
      }}
    >
      {/* photo area — washed-out alley shot at night */}
      <div
        className="mx-3 mt-3 h-[100px]"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 30% 30%, rgba(255,200,120,0.3), transparent 70%), linear-gradient(180deg, #1f1812 0%, #0f0a06 100%)',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)',
        }}
      >
        {/* tiny silhouette eyes */}
        <div className="relative h-full">
          <span
            className="absolute h-1 w-1 rounded-full bg-[#e5a042]"
            style={{ top: '52%', left: '38%', boxShadow: '0 0 4px #e5a042' }}
          />
          <span
            className="absolute h-1 w-1 rounded-full bg-[#e5a042]"
            style={{ top: '52%', left: '46%', boxShadow: '0 0 4px #e5a042' }}
          />
        </div>
      </div>
      {/* coffee ring across the bottom strip */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: -8,
          bottom: -10,
          width: 60,
          height: 60,
          border: '3px solid rgba(80,45,20,0.4)',
          borderRadius: '50%',
          filter: 'blur(0.6px)',
          transform: 'rotate(-18deg)',
        }}
      />
      {/* handwritten value */}
      <div className="px-3 pb-3 pt-2 text-center">{children}</div>
    </div>
  );
}

/**
 * Foil gum wrapper — silver gradient, jagged torn edges, ballpoint scrawl.
 * Hosts ERR.
 */
export function GumWrapper({ children }: { children?: ReactNode }) {
  return (
    <div
      className="relative w-[130px] px-3 py-3 text-center"
      style={{
        ...FOIL_BG,
        clipPath: FOIL_TORN,
        boxShadow: '0 10px 16px -6px rgba(0,0,0,0.55)',
        color: '#1a1410',
      }}
    >
      {/* faint brand ghost on the foil */}
      <p
        className="absolute inset-x-0 top-1 text-center font-mono text-[9px] uppercase tracking-[0.4em] opacity-25"
        style={{ color: '#1a1410' }}
      >
        spearmint
      </p>
      {children}
    </div>
  );
}

/**
 * Matchbook — atmosphere only. Tiny accent peeking out of the pile.
 */
export function Matchbook() {
  return (
    <div
      className="relative h-[60px] w-[80px] overflow-hidden rounded-sm"
      style={{
        background:
          'linear-gradient(180deg, #5a1a1a 0%, #3a0e0e 100%)',
        boxShadow:
          '0 10px 14px -6px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,180,140,0.15), inset 0 -2px 0 rgba(0,0,0,0.5)',
      }}
    >
      {/* foil border */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-sm"
        style={{
          border: '1px solid rgba(220,170,90,0.45)',
          margin: 3,
        }}
      />
      {/* type */}
      <div className="relative px-2 pt-2 text-center">
        <p
          className="font-serif text-[9px] italic"
          style={{ color: '#e5c089', letterSpacing: '0.05em' }}
        >
          Starlight
        </p>
        <p
          className="font-serif text-[7px] italic"
          style={{ color: '#e5c089', opacity: 0.75 }}
        >
          lounge · 1402 pine
        </p>
      </div>
      {/* claw scratches */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(112deg, transparent 0 8px, rgba(240,220,180,0.35) 8px 9px, transparent 9px 22px)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'repeating-linear-gradient(112deg, transparent 0 14px, rgba(240,220,180,0.25) 14px 15px, transparent 15px 30px)',
          mixBlendMode: 'screen',
          transform: 'translate(2px, -1px)',
        }}
      />
    </div>
  );
}

/**
 * Vinny's Auto Body promo calendar — replaces the prior calendar styling.
 * Same data binding (today's day name + day number; passage index/total).
 */
export function VinnyCalendar({
  total,
  index,
  activeDays,
}: {
  total: number;
  index: number;
  /** Days of the current week (0 = Sunday … 6 = Saturday) the signed-in
   * user had typing activity on. When undefined, no day is X'd. */
  activeDays?: ReadonlySet<number>;
}) {
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const day = today.getDate();
  const todayIdx = today.getDay(); // 0..6, Sun..Sat
  const weekDays = ['s', 'm', 't', 'w', 't', 'f', 's'];
  return (
    <div
      className="relative w-[170px] overflow-hidden rounded-sm bg-[#f7ead0] text-center"
      style={{ boxShadow: '0 12px 20px -8px rgba(0,0,0,0.65)' }}
    >
      {/* shop header */}
      <div
        className="px-2 py-1.5"
        style={{
          background: 'linear-gradient(180deg, #c85a4a 0%, #a3402f 100%)',
          color: '#fff8e7',
        }}
      >
        <p className="font-serif text-[14px] font-bold italic leading-tight">
          Vinny's Auto Body
        </p>
        <p
          className="font-mono text-[9px] uppercase tracking-[0.35em] opacity-90"
        >
          ☎ klondike-5 · 0142
        </p>
      </div>

      {/* big date with red marker circle */}
      <div className="relative py-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[#2a1f12]/70">
          {dayName}
        </p>
        <p className="font-serif text-4xl font-bold italic text-[#2a1f12]">
          {day}
        </p>
        {/* red marker circle */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 60,
            height: 56,
            border: '2.5px solid rgba(200,60,50,0.85)',
            borderRadius: '46% 54% 52% 48% / 50% 48% 52% 50%',
            filter: 'blur(0.3px)',
            transform: 'translate(-52%, -45%) rotate(-8deg)',
            opacity: 0.9,
          }}
        />
      </div>

      {/* mini week strip — Sun..Sat. Active days get an X stamp; today
          gets an underline marker so the user can see where they are. */}
      <div className="flex justify-around border-t border-[#c4ab6d]/50 px-2 pb-1.5 pt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#2a1f12]/70">
        {weekDays.map((d, i) => {
          const isToday = i === todayIdx;
          const isActive = activeDays?.has(i) ?? false;
          return (
            <span
              key={`${d}-${i}`}
              className="relative inline-flex h-5 w-5 items-center justify-center"
              aria-label={
                isToday
                  ? `${d.toUpperCase()} (today)`
                  : isActive
                    ? `${d.toUpperCase()} (active)`
                    : d.toUpperCase()
              }
            >
              <span className={isToday ? 'font-bold text-[#2a1f12]' : ''}>
                {d}
              </span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center text-[16px] text-[#c85a4a]/85"
                  style={{ transform: 'rotate(12deg)' }}
                >
                  ✕
                </span>
              )}
              {isToday && (
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 left-1/2 h-[2px] w-3 -translate-x-1/2 rounded-full bg-[#c85a4a]"
                />
              )}
            </span>
          );
        })}
      </div>

      {/* passage tracker */}
      <div className="border-t border-[#c4ab6d]/40 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[#2a1f12]/70">
        passage {index + 1} / {total}
      </div>
    </div>
  );
}

/**
 * "PROPERTY OF —" file cards — restyles the existing CardStack visually
 * by wrapping it in a labeled header, and theming the cards with a
 * scratched-out owner stamp.
 */
export function PropertyOfHeader() {
  return (
    <div className="mb-1 flex flex-col items-center">
      <div
        className="relative inline-flex items-center gap-2 px-2 py-1"
        style={{
          background: '#e6d4a8',
          boxShadow: '0 4px 6px -2px rgba(0,0,0,0.4)',
          transform: 'rotate(-1deg)',
        }}
      >
        <p
          className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#2a1f12]/80"
        >
          property of —
        </p>
        {/* marker scratch-out */}
        <span
          aria-hidden
          className="inline-block h-3 w-12"
          style={{
            background:
              'repeating-linear-gradient(15deg, rgba(20,10,5,0.85) 0 3px, rgba(20,10,5,0.55) 3px 5px)',
            transform: 'rotate(-3deg) translateY(-1px)',
            borderRadius: 1,
          }}
        />
      </div>
      <p
        className={cn(
          'mt-1 font-serif text-[10px] italic text-[#f1e4c5]/85',
        )}
        style={{ transform: 'rotate(-2deg)' }}
      >
        — fresh haul —
      </p>
    </div>
  );
}
