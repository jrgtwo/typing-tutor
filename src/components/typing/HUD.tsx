import { memo, useEffect, useState } from 'react';
import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { cn } from '@/lib/utils';

/**
 * Live WPM / accuracy / timer. Uses its own setInterval for the elapsed
 * clock so the rest of the UI doesn't re-render on every tick.
 */
function HUDImpl() {
  const status = useEngineStore((s) => s.status);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [status]);

  const endTime = status === 'finished' ? (finishedAt ?? now) : now;
  const elapsedMs = startedAt ? Math.max(0, endTime - startedAt) : 0;
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
