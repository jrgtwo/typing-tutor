import type { HudProps } from '../types';
import type { RaceClockConfig } from './index';

export function RaceClockHud({
  difficulty,
  elapsedMs,
}: HudProps<unknown, RaceClockConfig>) {
  const remaining = Math.max(0, difficulty.durationMs - elapsedMs);
  const remainingSec = Math.ceil(remaining / 1000);
  const fraction = difficulty.durationMs > 0 ? remaining / difficulty.durationMs : 0;
  const angle = -360 * (1 - fraction);
  const isUrgent = remaining <= 10_000 && remaining > 0;

  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{ left: '18%', bottom: -34, transform: 'rotate(8deg)' }}
    >
      <div
        className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #e6c07a 0%, #8a6a2a 80%)',
          boxShadow: '0 12px 20px -8px rgba(0,0,0,0.7), inset 0 0 18px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="flex h-[90px] w-[90px] items-center justify-center rounded-full bg-[#f7ead0]"
          style={{ boxShadow: 'inset 0 0 10px rgba(80,55,20,0.4)' }}
        >
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke={isUrgent ? '#c85a4a' : '#8a6a2a'}
              strokeOpacity={0.25}
              strokeWidth="6"
            />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke={isUrgent ? '#c85a4a' : '#2a1f12'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 38}
              strokeDashoffset={2 * Math.PI * 38 * (1 - fraction)}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 100ms linear' }}
            />
            <text
              x="50"
              y="50"
              textAnchor="middle"
              dominantBaseline="central"
              fill="#2a1f12"
              style={{
                fontFamily: 'IBM Plex Serif, Georgia, serif',
                fontStyle: 'italic',
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {remainingSec}
            </text>
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="15"
              stroke={isUrgent ? '#c85a4a' : '#2a1f12'}
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
              style={{ transition: 'transform 100ms linear' }}
            />
            <circle cx="50" cy="50" r="2.5" fill="#2a1f12" />
          </svg>
        </div>
      </div>
    </div>
  );
}
