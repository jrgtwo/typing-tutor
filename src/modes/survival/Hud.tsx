import type { HudProps } from '../types';
import type { SurvivalConfig, SurvivalState } from './index';

export function SurvivalHud({ state, difficulty }: HudProps<SurvivalState, SurvivalConfig>) {
  const total = difficulty.strikes;
  const left = state.strikesLeft;
  return (
    <div
      className="pointer-events-none absolute z-10 flex items-center gap-2"
      style={{ left: '12%', bottom: -28, transform: 'rotate(6deg)' }}
    >
      <div
        className="rounded-sm px-2 py-1 font-mono text-[9px] uppercase tracking-[0.4em] text-[#f1e4c5]/85"
        style={{ background: 'rgba(20,12,6,0.55)' }}
      >
        strikes
      </div>
      <div className="flex items-end gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <PaperBall key={i} crumpled={i >= left} />
        ))}
      </div>
    </div>
  );
}

function PaperBall({ crumpled }: { crumpled: boolean }) {
  if (crumpled) {
    return (
      <span
        aria-hidden
        className="block opacity-50"
        style={{
          width: 22,
          height: 22,
          // crumpled, flattened — already used
          background:
            'radial-gradient(circle at 35% 35%, #c4b18a 0%, #6e5a3c 90%)',
          clipPath:
            'polygon(20% 5%, 60% 0%, 90% 20%, 100% 55%, 80% 95%, 35% 100%, 5% 70%, 10% 35%)',
          filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))',
        }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="block"
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at 30% 30%, #fff7df 0%, #d8c28a 100%)',
        boxShadow:
          'inset 0 -3px 4px rgba(80,55,20,0.3), 0 4px 6px -2px rgba(0,0,0,0.5)',
      }}
    />
  );
}
