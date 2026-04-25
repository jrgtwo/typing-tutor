import { useEngineStore } from '@/engine/store';
import { AdSlot } from './AdSlot';
import type { PlanProfile } from '@/lib/plan';
import { cn } from '@/lib/utils';

interface BetweenSessionsAdProps {
  profile?: PlanProfile | null;
  className?: string;
}

/**
 * Renders the `practice.between_sessions` AdSlot only when the engine is in
 * `finished` state — never while the user is typing. Drop into any practice
 * variant's layout; the gating lives here so variants stay one-liners.
 */
export function BetweenSessionsAd({ profile, className }: BetweenSessionsAdProps) {
  const status = useEngineStore((s) => s.status);
  if (status !== 'finished') return null;
  return (
    <div className={cn('my-6', className)}>
      <AdSlot placement="practice.between_sessions" profile={profile} />
    </div>
  );
}
