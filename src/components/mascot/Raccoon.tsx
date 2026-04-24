import { cn } from '@/lib/utils';

type Mood = 'neutral' | 'judgy' | 'smug' | 'pleased' | 'shook';

interface RaccoonProps {
  mood?: Mood;
  size?: number;
  className?: string;
}

/**
 * SVG cartoon raccoon mascot. One head-and-shoulders pose, five mood
 * variations expressed through eye/brow/mouth overrides. Pure SVG so
 * it scales without blur and doesn't need an asset pipeline.
 */
export function Raccoon({ mood = 'neutral', size = 140, className }: RaccoonProps) {
  const eyes = EYE_BY_MOOD[mood];
  const mouth = MOUTH_BY_MOOD[mood];
  const browTilt = BROW_TILT_BY_MOOD[mood];

  return (
    <svg
      viewBox="0 0 140 150"
      width={size}
      height={(size * 150) / 140}
      className={cn('select-none', className)}
      aria-hidden="true"
    >
      {/* striped tail peeking behind the left shoulder */}
      <g transform="rotate(-12 22 120)">
        <path
          d="M 8 120 Q 4 95 18 78 L 30 90 Q 22 100 22 120 Z"
          fill="#6a6560"
        />
        <rect x="7" y="96" width="22" height="7" fill="#1c1916" transform="rotate(-10 18 100)" />
        <rect x="5" y="108" width="22" height="7" fill="#1c1916" transform="rotate(-10 16 112)" />
      </g>

      {/* neck / chest fluff */}
      <ellipse cx="70" cy="130" rx="38" ry="18" fill="#8a8886" />
      <ellipse cx="70" cy="134" rx="22" ry="9" fill="#f2ede4" />

      {/* ears — outer */}
      <path d="M 32 48 L 36 22 L 54 42 Z" fill="#6a6560" />
      <path d="M 108 48 L 104 22 L 86 42 Z" fill="#6a6560" />
      {/* ears — inner */}
      <path d="M 38 44 L 40 30 L 48 42 Z" fill="#d9a69a" />
      <path d="M 102 44 L 100 30 L 92 42 Z" fill="#d9a69a" />

      {/* head */}
      <ellipse cx="70" cy="72" rx="45" ry="42" fill="#8a8886" />
      {/* cheek shading */}
      <ellipse cx="32" cy="82" rx="10" ry="14" fill="#6a6560" opacity="0.4" />
      <ellipse cx="108" cy="82" rx="10" ry="14" fill="#6a6560" opacity="0.4" />

      {/* forehead/top white V */}
      <path
        d="M 48 38 Q 70 24 92 38 L 84 58 Q 70 50 56 58 Z"
        fill="#f2ede4"
      />

      {/* bandit mask */}
      <path
        d="M 22 58
           Q 38 48 56 56
           Q 70 48 84 56
           Q 102 48 118 58
           Q 114 78 94 76
           Q 80 70 70 76
           Q 60 70 46 76
           Q 26 78 22 58 Z"
        fill="#1a1712"
      />

      {/* brows (tilt by mood) */}
      <g>
        <rect
          x="37"
          y="52"
          width="18"
          height="3"
          rx="1.5"
          fill="#1a1712"
          transform={`rotate(${-browTilt} 46 54)`}
        />
        <rect
          x="85"
          y="52"
          width="18"
          height="3"
          rx="1.5"
          fill="#1a1712"
          transform={`rotate(${browTilt} 94 54)`}
        />
      </g>

      {/* eyes */}
      {eyes}

      {/* muzzle */}
      <ellipse cx="70" cy="96" rx="22" ry="14" fill="#f2ede4" />

      {/* nose */}
      <path d="M 64 84 Q 70 80 76 84 Q 74 90 70 91 Q 66 90 64 84 Z" fill="#1a1712" />
      <path d="M 70 91 L 70 96" stroke="#1a1712" strokeWidth="1.2" strokeLinecap="round" />

      {/* mouth */}
      {mouth}

      {/* whiskers */}
      <g stroke="#1a1712" strokeWidth="0.7" strokeLinecap="round" opacity="0.55">
        <line x1="50" y1="98" x2="36" y2="96" />
        <line x1="50" y1="102" x2="34" y2="104" />
        <line x1="90" y1="98" x2="104" y2="96" />
        <line x1="90" y1="102" x2="106" y2="104" />
      </g>
    </svg>
  );
}

const EYE_BY_MOOD: Record<Mood, React.ReactNode> = {
  neutral: (
    <>
      <circle cx="48" cy="66" r="5" fill="#f2ede4" />
      <circle cx="92" cy="66" r="5" fill="#f2ede4" />
      <circle cx="49" cy="67" r="2.4" fill="#1a1712" />
      <circle cx="93" cy="67" r="2.4" fill="#1a1712" />
      <circle cx="50" cy="66" r="0.9" fill="#f2ede4" />
      <circle cx="94" cy="66" r="0.9" fill="#f2ede4" />
    </>
  ),
  // eyes cut down to slits
  judgy: (
    <>
      <rect x="43" y="65" width="10" height="2.2" rx="1.1" fill="#f2ede4" />
      <rect x="87" y="65" width="10" height="2.2" rx="1.1" fill="#f2ede4" />
    </>
  ),
  // one raised brow + side-glance pupils
  smug: (
    <>
      <circle cx="48" cy="66" r="5" fill="#f2ede4" />
      <circle cx="92" cy="66" r="5" fill="#f2ede4" />
      <circle cx="51" cy="67" r="2.4" fill="#1a1712" />
      <circle cx="95" cy="67" r="2.4" fill="#1a1712" />
    </>
  ),
  // closed-arc eyes
  pleased: (
    <>
      <path d="M 43 68 Q 48 62 53 68" stroke="#f2ede4" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M 87 68 Q 92 62 97 68" stroke="#f2ede4" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </>
  ),
  // wide & shiny
  shook: (
    <>
      <circle cx="48" cy="66" r="6.5" fill="#f2ede4" />
      <circle cx="92" cy="66" r="6.5" fill="#f2ede4" />
      <circle cx="48" cy="66" r="2" fill="#1a1712" />
      <circle cx="92" cy="66" r="2" fill="#1a1712" />
      <circle cx="49" cy="64.5" r="1" fill="#f2ede4" />
      <circle cx="93" cy="64.5" r="1" fill="#f2ede4" />
    </>
  ),
};

const MOUTH_BY_MOOD: Record<Mood, React.ReactNode> = {
  // small W smirk
  neutral: (
    <>
      <path d="M 64 104 Q 67 108 70 105" stroke="#1a1712" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M 70 105 Q 73 108 76 104" stroke="#1a1712" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  // flat line
  judgy: (
    <path d="M 62 105 L 78 105" stroke="#1a1712" strokeWidth="1.8" strokeLinecap="round" />
  ),
  // one-side smirk
  smug: (
    <path d="M 62 105 Q 70 110 78 103" stroke="#1a1712" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  ),
  // open smile
  pleased: (
    <path
      d="M 60 102 Q 70 114 80 102 Q 70 108 60 102 Z"
      fill="#1a1712"
    />
  ),
  // small o mouth
  shook: (
    <ellipse cx="70" cy="106" rx="3" ry="3.8" fill="#1a1712" />
  ),
};

const BROW_TILT_BY_MOOD: Record<Mood, number> = {
  neutral: 0,
  judgy: 18,
  smug: 10,
  pleased: -10,
  shook: -18,
};
