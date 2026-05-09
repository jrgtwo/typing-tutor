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
 * Rubber-stamp tray that lives at the top-left of the desk. Each mode
 * registers itself with a `stamp` config (label, ink color, frame), and the
 * tray renders one stamp per registered mode driven by `listModes()`. The
 * picker has zero hardcoded knowledge of specific modes — adding a new mode
 * to the registry makes its stamp appear here automatically.
 *
 * Difficulty is a separate row of small ink-pad chips beneath the tray.
 */
export function StampTray({
  modes,
  activeId,
  difficulty,
  onSelectMode,
  onSelectDifficulty,
}: Props) {
  return (
    <div
      className="relative inline-flex flex-col items-center gap-2 rounded-sm px-3 py-3"
      style={{
        background:
          'linear-gradient(180deg, #5a3d1c 0%, #3d2710 100%)',
        boxShadow:
          '0 14px 22px -8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,200,140,0.18), inset 0 -2px 0 rgba(0,0,0,0.4)',
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#f1e4c5]/70">
        — stamp tray —
      </p>

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
                  'mt-0.5 font-mono text-[9px] uppercase tracking-[0.3em] ' +
                  (active ? 'text-[#fff7df]' : 'text-[#f1e4c5]/60')
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
                'rounded-sm px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.3em] transition-colors ' +
                (active
                  ? 'bg-[#e5a042] text-[#2a1f12]'
                  : 'text-[#f1e4c5]/60 hover:text-[#f1e4c5]')
              }
            >
              {DIFFICULTY_LABEL[d]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
