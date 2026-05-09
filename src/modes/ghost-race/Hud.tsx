import { useEngineStore } from '@/engine/store';
import type { HudProps } from '../types';
import type { GhostRaceConfig, GhostRaceState } from './index';
import { ghostCharsAt } from './storage';

export function GhostRaceHud({
  state,
  elapsedMs,
}: HudProps<GhostRaceState, GhostRaceConfig>) {
  const userCharsCorrect = useEngineStore((s) => s.charsCorrect);
  const target = useEngineStore((s) => s.target);
  const length = target.length || state.passageLength || 1;

  const ghostChars = state.record ? ghostCharsAt(state.record, elapsedMs) : null;
  const userFraction = Math.min(1, userCharsCorrect / length);
  const ghostFraction = ghostChars != null ? Math.min(1, ghostChars / length) : null;
  const margin = ghostChars != null ? userCharsCorrect - ghostChars : null;
  const ahead = margin != null && margin >= 0;

  return (
    <div
      className="pointer-events-none absolute z-10 flex flex-col items-start gap-1"
      style={{ left: '14%', bottom: -32, transform: 'rotate(2deg)' }}
    >
      <div
        className="rounded-sm px-3 py-2 text-[#2a1f12]"
        style={{
          background: 'linear-gradient(180deg, #faf2d9 0%, #efdfb3 100%)',
          boxShadow: '0 8px 14px -6px rgba(0,0,0,0.55)',
        }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] opacity-60">
          ghost
        </p>
        {state.record ? (
          <p className="mt-0.5 font-serif text-base italic leading-none">
            {Math.round(state.record.wpm)}
            <span className="ml-1 font-mono text-[10px] not-italic opacity-60">wpm</span>
          </p>
        ) : (
          <p className="mt-0.5 font-serif text-sm italic leading-none opacity-60">
            setting pace
          </p>
        )}
        {margin != null && (
          <p
            className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em]"
            style={{ color: ahead ? '#3a8b6c' : '#c85a4a' }}
          >
            {ahead ? '+' : ''}
            {margin} chars
          </p>
        )}
      </div>

      <div
        className="relative h-2 w-32 overflow-hidden rounded-sm"
        style={{ background: 'rgba(20,12,6,0.55)' }}
      >
        {/* user progress (solid) */}
        <div
          className="absolute left-0 top-0 h-full"
          style={{
            width: `${userFraction * 100}%`,
            background: ahead || ghostFraction == null ? '#5a8fb8' : '#c85a4a',
            transition: 'width 120ms ease-out',
          }}
        />
        {/* ghost marker (translucent vertical rule) */}
        {ghostFraction != null && (
          <div
            className="absolute top-0 h-full"
            style={{
              left: `${ghostFraction * 100}%`,
              width: 2,
              background: '#f1e4c5',
              opacity: 0.85,
              boxShadow: '0 0 6px rgba(241,228,197,0.85)',
              transition: 'left 120ms linear',
            }}
          />
        )}
      </div>
    </div>
  );
}
