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

/**
 * v1: renders nothing. The slot exists so layouts reserve space and
 * future ad-network integration is a one-file change. Ads are explicitly
 * never rendered on the typing surface itself — only chrome placements.
 */
export function AdSlot({ placement: _placement, profile, className }: AdSlotProps) {
  if (can(profile, 'ads.hidden')) return null;

  // No ad network wired in v1. Reserve dimensions when a placement gets one.
  return <div className={cn('ad-slot', className)} data-ad-placement={_placement} />;
}
