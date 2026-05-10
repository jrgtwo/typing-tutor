import { useState } from 'react';
import { Stamp } from '@/modes/_shared/Stamp';
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_LEVELS,
  type Difficulty,
  type SessionMode,
} from '@/modes';

interface Props {
  modes: SessionMode<any, any>[];
  activeId: string;
  difficulty: Difficulty;
  onSelectMode: (id: string) => void;
  onSelectDifficulty: (d: Difficulty) => void;
}

/**
 * A wooden stamp box that opens when clicked. Closed: just a flat lid
 * with the box title and the currently-loaded stamp showing through. Open:
 * the lid hinges up and back, revealing rubber stamps and difficulty
 * chips inside. The picker has zero hardcoded knowledge of specific modes
 * — adding a new mode to the registry makes its stamp appear here
 * automatically.
 */
export function StampTray({
  modes,
  activeId,
  difficulty,
  onSelectMode,
  onSelectDifficulty,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const activeMode = modes.find((m) => m.id === activeId);

  return (
    <div
      className="relative w-full"
      style={{ perspective: 1100 }}
    >
      {/* OUTER BOX — the wooden carcass. Holds the lid (which flips up)
          and the interior tray below. When the lid is up the interior is
          revealed; when closed the lid sits flat on top. */}
      <div
        className="relative rounded-sm"
        style={{
          background:
            'linear-gradient(180deg, #3d2710 0%, #271808 100%)',
          boxShadow:
            '0 14px 22px -8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,200,140,0.12), inset 0 -2px 0 rgba(0,0,0,0.4)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* LID — clickable, hinges around its TOP edge so it flips up
            when opening. Has a front face (title + active mode + chevron)
            and a back face (plain wood underside) so it looks right at
            any rotation. */}
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close stamp box' : 'Open stamp box'}
          className="relative block w-full text-left"
          style={{
            transformOrigin: '50% 0%',
            transform: isOpen ? 'rotateX(-104deg)' : 'rotateX(0deg)',
            transition:
              'transform 460ms cubic-bezier(0.22, 0.85, 0.3, 1)',
            transformStyle: 'preserve-3d',
            zIndex: 2,
          }}
        >
          {/* lid FRONT face — visible when closed */}
          <div
            className="flex items-center justify-between rounded-sm px-4 py-3"
            style={{
              background:
                'linear-gradient(180deg, #6a4820 0%, #4a3015 100%)',
              borderBottom: '2px solid rgba(0,0,0,0.45)',
              color: '#f1e4c5',
              backfaceVisibility: 'hidden',
              boxShadow: 'inset 0 1px 0 rgba(255,210,150,0.18)',
            }}
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: '#c4ab6d', boxShadow: '0 0 4px #c4ab6d' }}
              />
              <span className="font-mono text-[12px] uppercase tracking-[0.4em]">
                stamp box
              </span>
            </span>
            <span className="flex items-center gap-3">
              {activeMode && (
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-[0.3em] opacity-70">
                    loaded
                  </span>
                  <span className="font-serif text-base italic">
                    {activeMode.label}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60">
                    · {DIFFICULTY_LABEL[difficulty]}
                  </span>
                </span>
              )}
              <span
                className="font-mono text-[14px] opacity-75"
                aria-hidden
              >
                {isOpen ? '▴' : '▾'}
              </span>
            </span>
          </div>

          {/* lid BACK face — visible when the lid has flipped up. Plain
              dark wood with a small label so the user can tell it's the
              underside of the lid. */}
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center rounded-sm px-4 py-3"
            style={{
              background:
                'linear-gradient(0deg, #3a2510 0%, #221408 100%), repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 5px)',
              backgroundBlendMode: 'multiply',
              transform: 'rotateX(180deg)',
              backfaceVisibility: 'hidden',
              boxShadow:
                'inset 0 0 0 1px rgba(0,0,0,0.5), inset 0 4px 8px rgba(0,0,0,0.5)',
              color: 'rgba(241,228,197,0.4)',
            }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.5em]">
              — lid —
            </span>
          </div>
        </button>

        {/* INTERIOR — stamps + difficulty. Hidden behind the lid when
            closed via maxHeight 0; expands when open. */}
        <div
          className="relative overflow-hidden"
          style={{
            maxHeight: isOpen ? 320 : 0,
            opacity: isOpen ? 1 : 0,
            transition:
              'max-height 460ms cubic-bezier(0.22, 0.85, 0.3, 1), opacity 260ms ease-out 140ms',
          }}
        >
          {/* INTERIOR HEADER STRIP — always-visible close affordance when
              the box is open, since the lid itself has flipped away and
              wouldn't be obviously clickable. */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close stamp box"
            tabIndex={isOpen ? 0 : -1}
            className="flex w-full items-center justify-between px-4 py-2 transition-colors hover:bg-[#3a2510]/70"
            style={{
              background: 'rgba(20,12,6,0.55)',
              borderBottom: '1px solid rgba(0,0,0,0.5)',
              color: '#f1e4c5',
            }}
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: '#c4ab6d', boxShadow: '0 0 4px #c4ab6d' }}
              />
              <span className="font-mono text-[12px] uppercase tracking-[0.4em]">
                stamp box · open
              </span>
            </span>
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.3em] opacity-85">
              ▴ close
            </span>
          </button>

          <div
            className="flex flex-col items-center gap-2 px-3 pb-3 pt-3"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,200,140,0.08), transparent 70%)',
            }}
          >
            <div className="flex items-end gap-2">
              {modes.map((m) => {
                const active = m.id === activeId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMode(m.id)}
                    aria-label={`Switch to ${m.label}`}
                    aria-pressed={active}
                    title={m.description}
                    className="group relative flex flex-col items-center gap-1 rounded-sm px-1 py-1 transition-transform"
                    style={{
                      transform: active ? 'translateY(-3px)' : 'none',
                    }}
                  >
                    {/* wooden handle */}
                    <span
                      aria-hidden
                      className="block"
                      style={{
                        width: 18,
                        height: 16,
                        background:
                          'linear-gradient(180deg, #8b6230 0%, #5a3d1c 100%)',
                        borderRadius: '4px 4px 2px 2px',
                        boxShadow:
                          'inset 0 1px 0 rgba(255,200,140,0.3), 0 1px 0 rgba(0,0,0,0.4)',
                      }}
                    />
                    {/* metal collar */}
                    <span
                      aria-hidden
                      className="block"
                      style={{
                        width: 56,
                        height: 6,
                        background:
                          'linear-gradient(180deg, #c4ab6d 0%, #8a6a2a 100%)',
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,0.35), 0 1px 0 rgba(0,0,0,0.4)',
                      }}
                    />
                    {/* face — rubber */}
                    <span
                      aria-hidden
                      className="flex items-center justify-center"
                      style={{
                        width: 64,
                        height: 64,
                        background:
                          'radial-gradient(circle at 35% 35%, #faf2d9 0%, #d8c28a 100%)',
                        borderRadius: 6,
                        boxShadow:
                          '0 6px 10px -3px rgba(0,0,0,0.55), inset 0 -2px 3px rgba(80,55,20,0.25)',
                      }}
                    >
                      <Stamp stamp={m.stamp} scale={0.78} />
                    </span>
                    <span
                      className={
                        'mt-0.5 font-mono text-[11px] uppercase tracking-[0.3em] ' +
                        (active ? 'text-[#fff7df]' : 'text-[#f1e4c5]/65')
                      }
                    >
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-1 flex items-center gap-1 rounded-sm bg-[#2a1d12]/55 px-2 py-1">
              {DIFFICULTY_LEVELS.map((d) => {
                const active = d === difficulty;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onSelectDifficulty(d as Difficulty)}
                    aria-pressed={active}
                    className={
                      'rounded-sm px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.3em] transition-colors ' +
                      (active
                        ? 'bg-[#e5a042] text-[#2a1f12]'
                        : 'text-[#f1e4c5]/65 hover:text-[#f1e4c5]')
                    }
                  >
                    {DIFFICULTY_LABEL[d]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
