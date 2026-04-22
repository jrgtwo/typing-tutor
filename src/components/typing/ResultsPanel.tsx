import { useEngineStore } from '@/engine/store';
import { computeAccuracy, computeWpm } from '@/engine/metrics';
import { PaperPanel } from '@/components/chrome/PaperPanel';
import { cn } from '@/lib/utils';

interface ResultsPanelProps {
  onReset: () => void;
  onNext?: () => void;
}

export function ResultsPanel({ onReset, onNext }: ResultsPanelProps) {
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);
  const charsCorrect = useEngineStore((s) => s.charsCorrect);
  const charsTyped = useEngineStore((s) => s.charsTyped);
  const errors = useEngineStore((s) => s.errors);

  const elapsedMs = startedAt && finishedAt ? finishedAt - startedAt : 0;
  const wpm = computeWpm(charsCorrect, elapsedMs);
  const accuracy = computeAccuracy(charsCorrect, charsTyped);

  return (
    <PaperPanel className="space-y-5">
      <header className="flex items-baseline justify-between">
        <h2 className="font-serif text-2xl">Done.</h2>
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
          {/* Quietly judgmental, brand-tone copy */}
          The raccoon nods, almost imperceptibly.
        </span>
      </header>

      <dl className="grid grid-cols-3 gap-6 font-mono">
        <Stat label="WPM" value={wpm.toFixed(1)} accent />
        <Stat label="Accuracy" value={`${(accuracy * 100).toFixed(1)}%`} />
        <Stat label="Errors" value={String(errors)} muted={errors === 0} />
      </dl>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-[var(--color-ink)] px-4 py-2 font-mono text-sm uppercase tracking-wider text-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
        >
          Try again
        </button>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            className="rounded-md bg-[var(--color-amber)] px-4 py-2 font-mono text-sm uppercase tracking-wider text-[var(--color-paper)] hover:bg-[var(--color-amber)]/85"
          >
            Next passage
          </button>
        )}
      </div>
    </PaperPanel>
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
    <div className="flex flex-col gap-1">
      <dt className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
        {label}
      </dt>
      <dd
        className={cn(
          'font-mono text-3xl tabular-nums',
          accent && 'text-[var(--color-amber)]',
          muted && 'text-[var(--color-ink-soft)]/60',
          !accent && !muted && 'text-[var(--color-ink)]',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
