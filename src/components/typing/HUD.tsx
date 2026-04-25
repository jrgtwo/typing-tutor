import { memo } from 'react';
import { useEngineStore } from '@/engine/store';
import { useEngineElapsedMs } from '@/hooks/useEngineElapsedMs';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { cn } from '@/lib/utils';

function HUDImpl() {
  const status = useEngineStore((s) => s.status);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const elapsedMs = useEngineElapsedMs();
  const wpm = computeWpm(charsCorrect, elapsedMs);
  const accuracy = computeAccuracy(charsCorrect, charsTyped);

  return (
    <div className="flex items-baseline gap-8 font-mono">
      <Stat label="WPM" value={wpm.toFixed(0)} accent />
      <Stat label="ACC" value={`${(accuracy * 100).toFixed(1)}%`} />
      <Stat label="ERR" value={String(errors)} muted={errors === 0} />
      <Stat label="TIME" value={formatElapsed(elapsedMs)} />
      <span
        className={cn(
          'ml-auto text-xs uppercase tracking-[0.25em]',
          status === 'idle' && 'text-[var(--color-ink-soft)]',
          status === 'running' && 'text-[var(--color-phosphor-dim)]',
          status === 'finished' && 'text-[var(--color-amber)]',
        )}
      >
        {status}
      </span>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
        {label}
      </span>
      <span
        className={cn(
          'font-mono text-3xl tabular-nums',
          accent && 'text-[var(--color-amber)]',
          muted && 'text-[var(--color-ink-soft)]/60',
          !accent && !muted && 'text-[var(--color-ink)]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const HUD = memo(HUDImpl);
