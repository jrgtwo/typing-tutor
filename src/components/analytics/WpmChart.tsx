import { cn } from '@/lib/utils';

interface Point {
  x: number;
  y: number;
  wpm: number;
  finishedAt: string;
}

/**
 * Tiny SVG line chart of WPM over recent runs (oldest → newest, left →
 * right). No tooltips; the recent runs table beneath has the raw rows.
 * Returns null when there's nothing to plot so callers can render an
 * empty state of their choosing.
 */
export function WpmChart({
  values,
  finishedAtIso,
  className,
}: {
  values: number[];
  finishedAtIso: string[];
  className?: string;
}) {
  if (values.length < 2) return null;

  const W = 600;
  const H = 120;
  const PAD = 8;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);

  const points: Point[] = values.map((wpm, i) => {
    const x = PAD + ((W - 2 * PAD) * i) / (values.length - 1);
    const y = H - PAD - ((H - 2 * PAD) * (wpm - min)) / span;
    return { x, y, wpm, finishedAt: finishedAtIso[i] ?? '' };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${H - PAD} L ${points[0].x} ${H - PAD} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn('h-32 w-full', className)}
      role="img"
      aria-label={`WPM over last ${values.length} runs, low ${min.toFixed(0)}, high ${max.toFixed(0)}`}
    >
      <path d={fillPath} fill="var(--color-amber)" opacity="0.15" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-amber)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2"
          fill="var(--color-amber)"
        >
          <title>{`${p.wpm.toFixed(0)} wpm`}</title>
        </circle>
      ))}
    </svg>
  );
}
