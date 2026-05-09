import type { DifficultyEditorProps } from '../types';
import type { SprintConfig } from './index';

export function SprintDifficultyEditor({
  value,
  onChange,
}: DifficultyEditorProps<SprintConfig>) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
        Target words
      </span>
      <input
        type="number"
        min={1}
        max={1000}
        value={value.targetWords}
        onChange={(e) => {
          const next = Math.max(1, Math.min(1000, Number(e.target.value) || 1));
          onChange({ ...value, targetWords: next });
        }}
        className="mt-1 w-full rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink)]"
      />
    </label>
  );
}
