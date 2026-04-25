import { can, type PlanProfile } from '@/lib/plan';
import { cn } from '@/lib/utils';

export type AdPlacement =
  | 'landing.footer'
  | 'dashboard.sidebar'
  | 'practice.between_sessions';

interface AdSlotProps {
  placement: AdPlacement;
  profile?: PlanProfile | null;
  className?: string;
}

// Standard IAB sizes. The container reserves `height` + caps width at
// `maxWidth` so when a real ad unit renders there's no layout shift.
const DIMENSIONS: Record<AdPlacement, { maxWidth: number; height: number }> = {
  'landing.footer': { maxWidth: 728, height: 90 },
  'dashboard.sidebar': { maxWidth: 300, height: 250 },
  'practice.between_sessions': { maxWidth: 728, height: 90 },
};

/**
 * v1: no ad network wired. The slot still reserves its dimensions so when
 * the network lights up there is no CLS. Ads are explicitly never rendered
 * on the typing surface itself — only chrome placements.
 */
export function AdSlot({ placement, profile, className }: AdSlotProps) {
  if (can(profile, 'ads.hidden')) return null;

  const { maxWidth, height } = DIMENSIONS[placement];

  return (
    <div
      className={cn(
        'ad-slot mx-auto flex w-full flex-col items-center justify-center gap-1',
        'border-2 border-dashed border-[var(--color-ink-soft)]/50 bg-[var(--color-paper-deep)]/40',
        'font-mono uppercase tracking-[0.3em] text-[var(--color-ink-soft)]',
        className,
      )}
      style={{ maxWidth, height }}
      data-ad-placement={placement}
      aria-hidden="true"
    >
      <span className="text-[10px]">ad slot</span>
      <span className="text-[9px] opacity-60">{placement}</span>
      <span className="text-[9px] opacity-60">
        {DIMENSIONS[placement].maxWidth}×{DIMENSIONS[placement].height}
      </span>
    </div>
  );
}
