import type { HudProps } from '../types';
import type { DrillConfig, DrillState } from './index';

export function DrillHud({ state, difficulty }: HudProps<DrillState, DrillConfig>) {
  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ left: '14%', bottom: -28, transform: 'rotate(-3deg)' }}
    >
      <div
        className="rounded-sm px-3 py-2 text-[#2a1f12]"
        style={{
          background: '#9ddaa3',
          boxShadow: '0 8px 14px -6px rgba(0,0,0,0.55), inset 0 -8px 10px -6px rgba(0,0,0,0.15)',
        }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] opacity-70">
          worksheet
        </p>
        <p className="mt-0.5 font-serif text-base italic leading-none">
          {state.drillsCompleted + 1} of {difficulty.reps}
        </p>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] opacity-60">
          pool · {difficulty.pool}
        </p>
      </div>
    </div>
  );
}
