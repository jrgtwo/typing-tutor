import type { DifficultyEditorProps } from '../types';
import type { RaceClockConfig } from './index';

export function RaceClockDifficultyEditor({
  value,
  onChange,
}: DifficultyEditorProps<RaceClockConfig>) {
  const seconds = Math.round(value.durationMs / 1000);
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
          Duration (seconds)
        </span>
        <input
          type="number"
          min={5}
          max={600}
          value={seconds}
          onChange={(e) => {
            const next = Math.max(5, Math.min(600, Number(e.target.value) || 0));
            onChange({ ...value, durationMs: next * 1000 });
          }}
          className="mt-1 w-full rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink)]"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.autoRefill}
          onChange={(e) => onChange({ ...value, autoRefill: e.target.checked })}
          className="accent-[var(--color-ink)]"
        />
        <span className="font-mono text-xs text-[var(--color-ink)]">
          Auto-refill passage when finished early
        </span>
      </label>
    </div>
  );
}
