import { useEngineElapsedMs } from '@/hooks/useEngineElapsedMs';

/**
 * Practice mode's HUD: the count-up pocketwatch. It used to live inline in
 * the Desk variant, but ownership is moved here so that switching modes
 * cleanly swaps the HUD without the Desk needing mode-specific branches.
 */
export function PracticeHud() {
  const elapsed = useEngineElapsedMs();
  const secs = Math.floor(elapsed / 1000);
  const angle = (secs % 60) * 6;

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
            {[0, 90, 180, 270].map((a) => (
              <line
                key={a}
                x1="50"
                y1="10"
                x2="50"
                y2="18"
                stroke="#2a1f12"
                strokeWidth="2"
                transform={`rotate(${a} 50 50)`}
              />
            ))}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="15"
              stroke="#c85a4a"
              strokeWidth="2.5"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
              style={{ transition: 'transform 250ms linear' }}
            />
            <circle cx="50" cy="50" r="2.5" fill="#2a1f12" />
          </svg>
        </div>
      </div>
    </div>
  );
}
