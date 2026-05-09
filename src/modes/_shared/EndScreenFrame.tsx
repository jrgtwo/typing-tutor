import type { ReactNode } from 'react';
import type { FinalScore } from '../types';
import { formatDuration, formatNumber, formatPercent } from './format';

interface Props {
  title: string;
  score: FinalScore;
  flair?: ReactNode;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

/**
 * Yellowed paper card used by every mode's end screen. Modes can pass extra
 * decorative content via `flair` (e.g. "the desk has been flipped" graphic
 * for Survival, "you finished with 6s to spare" for Race the Clock).
 */
export function EndScreenFrame({
  title,
  score,
  flair,
  primaryAction,
  secondaryAction,
}: Props) {
  return (
    <div
      className="relative mx-auto w-full max-w-[420px] rounded-sm px-6 py-5 text-[#2a1f12]"
      style={{
        background:
          'linear-gradient(180deg, #faf2d9 0%, #efdfb3 100%)',
        boxShadow:
          '0 18px 36px -10px rgba(0,0,0,0.7), 0 4px 0 #d8c28a, inset 0 1px 0 rgba(255,255,255,0.4)',
      }}
    >
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] opacity-60">
        — final tally —
      </p>
      <h2 className="mt-1 text-center font-serif text-2xl italic">{title}</h2>

      <div className="mt-4 text-center">
        <p className="font-serif text-6xl italic tabular-nums">
          {formatPrimary(score)}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.4em] opacity-60">
          {score.primaryLabel}
        </p>
      </div>

      {score.details.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
          {score.details.map((d) => (
            <div key={d.label} className="flex justify-between border-b border-[#8a6a3a]/30 pb-0.5">
              <dt className="uppercase tracking-[0.25em] opacity-60">{d.label}</dt>
              <dd className="tabular-nums">{d.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {flair && <div className="mt-4">{flair}</div>}

      <div className="mt-5 flex justify-center gap-3">
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="rounded-sm bg-[#f1e4c5] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.35em] text-[#2a1f12] shadow-sm hover:bg-white"
          >
            {secondaryAction.label}
          </button>
        )}
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="rounded-sm bg-[#c85a4a] px-5 py-2 font-mono text-[11px] uppercase tracking-[0.35em] text-white shadow-md hover:bg-[#d86a5a]"
        >
          {primaryAction.label}
        </button>
      </div>
    </div>
  );
}

function formatPrimary(score: FinalScore): string {
  switch (score.primaryFormat) {
    case 'percent':
      return formatPercent(score.primary);
    case 'duration-ms':
      return formatDuration(score.primary);
    default:
      return formatNumber(score.primary);
  }
}
