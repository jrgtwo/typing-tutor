import type { DifficultyEditorProps } from '../types';
import type { SurvivalConfig } from './index';

export function SurvivalDifficultyEditor({
  value,
  onChange,
}: DifficultyEditorProps<SurvivalConfig>) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
          Strikes allowed
        </span>
        <input
          type="number"
          min={1}
          max={20}
          value={value.strikes}
          onChange={(e) => {
            const next = Math.max(1, Math.min(20, Number(e.target.value) || 1));
            onChange({ ...value, strikes: next });
          }}
          className="mt-1 w-full rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink)]"
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.banBackspace}
          onChange={(e) => onChange({ ...value, banBackspace: e.target.checked })}
          className="accent-[var(--color-ink)]"
        />
        <span className="font-mono text-xs text-[var(--color-ink)]">
          Ban backspace (NG+ rule)
        </span>
      </label>
    </div>
  );
}
