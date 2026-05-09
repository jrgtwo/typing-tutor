import type { HudProps } from '../types';
import type { SprintConfig, SprintState } from './index';

export function SprintHud({
  state,
  difficulty,
  elapsedMs,
}: HudProps<SprintState, SprintConfig>) {
  const fraction = Math.min(1, state.wordsCompleted / difficulty.targetWords);
  return (
    <div
      className="pointer-events-none absolute z-10 flex flex-col items-start gap-1"
      style={{ left: '15%', bottom: -28, transform: 'rotate(4deg)' }}
    >
      <div
        className="rounded-sm px-3 py-1.5 font-mono text-[#2a1f12]"
        style={{
          background: 'linear-gradient(180deg, #faf2d9 0%, #efdfb3 100%)',
          boxShadow: '0 8px 14px -6px rgba(0,0,0,0.6)',
        }}
      >
        <p className="text-[9px] uppercase tracking-[0.4em] opacity-60">words</p>
        <p className="font-serif text-2xl italic tabular-nums leading-none">
          {state.wordsCompleted}
          <span className="font-mono text-[12px] not-italic opacity-60">
            /{difficulty.targetWords}
          </span>
        </p>
      </div>
      <div
        className="h-1.5 w-24 overflow-hidden rounded-sm"
        style={{ background: 'rgba(20,12,6,0.55)' }}
      >
        <div
          className="h-full"
          style={{
            width: `${fraction * 100}%`,
            background: '#7a4ec8',
            transition: 'width 200ms ease-out',
          }}
        />
      </div>
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-[#f1e4c5]/70">
        {(elapsedMs / 1000).toFixed(1)}s
      </p>
    </div>
  );
}
