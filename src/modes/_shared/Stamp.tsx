import type { CSSProperties } from 'react';
import type { ModeStamp } from '../types';

interface Props {
  stamp: ModeStamp;
  /** Override font scale; default 1. */
  scale?: number;
  /** Render the inked impression style (low-opacity, slightly fuzzy) instead of the bold tray-stamp face. */
  inked?: boolean;
}

/**
 * Visual rendering of a mode's stamp: a circular badge with a decorative frame
 * around its label. Re-used by the stamp tray (clicked face) and the inked
 * impression on the notepad header (low-opacity overlay variant).
 */
export function Stamp({ stamp, scale = 1, inked = false }: Props) {
  const size = 72 * scale;
  const opacity = inked ? 0.78 : 1;
  const filter = inked ? 'blur(0.4px)' : 'none';
  const baseColor = stamp.inkColor;

  return (
    <span
      aria-hidden
      className="relative inline-block select-none"
      style={{
        width: size,
        height: size,
        color: baseColor,
        opacity,
        filter,
      }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <Frame frame={stamp.frame} />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          style={{
            fontFamily:
              'IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace',
            fontWeight: 800,
            fontSize: textSize(stamp.label),
            letterSpacing: '0.18em',
          } as CSSProperties}
        >
          {stamp.label.toUpperCase()}
        </text>
      </svg>
    </span>
  );
}

function textSize(label: string): number {
  const len = label.length;
  if (len <= 4) return 16;
  if (len <= 6) return 13;
  if (len <= 8) return 11;
  return 9;
}

function Frame({ frame }: { frame: ModeStamp['frame'] }) {
  switch (frame) {
    case 'starburst':
      return <Starburst />;
    case 'skull':
      return <Skull />;
    case 'plain':
    default:
      return <Plain />;
  }
}

function Plain() {
  return (
    <>
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.6"
      />
    </>
  );
}

function Starburst() {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <>
      {rays.map((angle) => (
        <line
          key={angle}
          x1="50"
          y1="8"
          x2="50"
          y2="18"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle
        cx="50"
        cy="50"
        r="32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </>
  );
}

function Skull() {
  return (
    <>
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      {/* crossbones behind the text */}
      <g
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.45"
      >
        <line x1="22" y1="22" x2="78" y2="78" />
        <line x1="78" y1="22" x2="22" y2="78" />
      </g>
    </>
  );
}
