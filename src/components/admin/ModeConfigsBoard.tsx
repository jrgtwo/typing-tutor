import { useEffect, useMemo, useState } from 'react';
import { PaperPanel } from '@/components/chrome/PaperPanel';
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_LEVELS,
  listModes,
  type Difficulty,
  type SessionMode,
} from '@/modes';
import {
  useResetModeConfig,
  useUpdateModeConfig,
  type AdminModeConfigRow,
} from '@/lib/queries';

interface Props {
  rows: AdminModeConfigRow[];
}

interface OverrideMap {
  [modeId: string]: { [difficulty: string]: AdminModeConfigRow };
}

function indexRows(rows: AdminModeConfigRow[]): OverrideMap {
  const out: OverrideMap = {};
  for (const r of rows) {
    if (!out[r.mode_id]) out[r.mode_id] = {};
    out[r.mode_id][r.difficulty] = r;
  }
  return out;
}

export function ModeConfigsBoard({ rows }: Props) {
  const modes = listModes();
  const overrides = useMemo(() => indexRows(rows), [rows]);

  return (
    <div className="space-y-6">
      <PaperPanel className="space-y-2">
        <header>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
            Mode configs
          </h2>
          <p className="mt-1 font-mono text-xs text-[var(--color-ink-soft)]">
            Overrides apply at runtime without a redeploy. Reset to revert to
            the code default for that difficulty.
          </p>
        </header>
      </PaperPanel>

      {modes.map((mode) => (
        <ModeCard
          key={mode.id}
          mode={mode}
          overridesForMode={overrides[mode.id] ?? {}}
        />
      ))}
    </div>
  );
}

function ModeCard({
  mode,
  overridesForMode,
}: {
  mode: SessionMode<any, any>;
  overridesForMode: Record<string, AdminModeConfigRow>;
}) {
  return (
    <PaperPanel className="space-y-3">
      <header className="flex items-baseline justify-between">
        <div>
          <h3 className="font-serif text-lg italic text-[var(--color-ink)]">
            {mode.label}
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
            id · {mode.id}
          </p>
        </div>
        <p className="font-mono text-xs text-[var(--color-ink-soft)]">
          {mode.description}
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {DIFFICULTY_LEVELS.map((d) => (
          <DifficultyCard
            key={d}
            mode={mode}
            difficulty={d}
            row={overridesForMode[d] ?? null}
          />
        ))}
      </div>
    </PaperPanel>
  );
}

function DifficultyCard({
  mode,
  difficulty,
  row,
}: {
  mode: SessionMode<any, any>;
  difficulty: Difficulty;
  row: AdminModeConfigRow | null;
}) {
  const codeDefault = mode.difficulties[difficulty];
  const override = row?.config ?? null;
  const effective = override ? { ...codeDefault, ...override } : codeDefault;

  const [draft, setDraft] = useState<Record<string, unknown>>(effective);
  const [feedback, setFeedback] = useState<string | null>(null);
  const update = useUpdateModeConfig();
  const reset = useResetModeConfig();
  const Editor = mode.DifficultyConfigEditor;

  // Re-sync draft if the row changes externally (other admin saves) and the
  // user hasn't started editing locally.
  const stableSig = JSON.stringify(effective);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemoSync(() => setDraft(effective), [stableSig]);

  function onSave() {
    setFeedback(null);
    const validation = mode.validateConfig(draft);
    if ('error' in validation) {
      setFeedback(validation.error);
      return;
    }
    update.mutate(
      { modeId: mode.id, difficulty, config: validation.ok as Record<string, unknown> },
      {
        onSuccess: () => setFeedback('Saved.'),
        onError: (err) => setFeedback(err.message),
      },
    );
  }

  function onReset() {
    setFeedback(null);
    reset.mutate(
      { modeId: mode.id, difficulty },
      {
        onSuccess: () => {
          setDraft(codeDefault);
          setFeedback('Reset to default.');
        },
        onError: (err) => setFeedback(err.message),
      },
    );
  }

  const pending = update.isPending || reset.isPending;
  const isOverridden = row != null;

  return (
    <div className="rounded-md border border-[var(--color-paper-deep)] p-3">
      <header className="mb-3 flex items-center justify-between">
        <h4 className="font-serif text-base italic text-[var(--color-ink)]">
          {DIFFICULTY_LABEL[difficulty]}
        </h4>
        <span
          className={
            'font-mono text-[10px] uppercase tracking-[0.3em] ' +
            (isOverridden ? 'text-[var(--color-amber)]' : 'text-[var(--color-ink-soft)]')
          }
        >
          {isOverridden ? 'override' : 'default'}
        </span>
      </header>

      {Editor ? (
        <Editor value={draft as any} onChange={(v: any) => setDraft(v)} />
      ) : (
        <GenericJsonEditor value={draft} onChange={setDraft} />
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={
            'truncate font-mono text-xs ' +
            (feedback?.startsWith('Saved') || feedback?.startsWith('Reset')
              ? 'text-[var(--color-ink-soft)]'
              : 'text-[var(--color-rust)]')
          }
        >
          {feedback ?? ''}
        </span>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={pending || !isOverridden}
            className="rounded-md border border-[var(--color-paper-deep)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink)] hover:border-[var(--color-ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={pending}
            className="rounded-md bg-[var(--color-ink)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {update.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function GenericJsonEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [err, setErr] = useState<string | null>(null);

  // External value changes (reset, sync) update the textarea.
  const externalSig = JSON.stringify(value);
  useMemoSync(() => {
    setText(JSON.stringify(value, null, 2));
    setErr(null);
  }, [externalSig]);

  function onText(next: string) {
    setText(next);
    try {
      const parsed = JSON.parse(next);
      if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setErr('config must be a JSON object');
        return;
      }
      setErr(null);
      onChange(parsed as Record<string, unknown>);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'invalid JSON');
    }
  }

  return (
    <div className="space-y-1">
      <textarea
        value={text}
        onChange={(e) => onText(e.target.value)}
        rows={6}
        spellCheck={false}
        className="w-full resize-y rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-2 py-1.5 font-mono text-[12px] leading-relaxed text-[var(--color-ink)]"
      />
      {err && (
        <p className="font-mono text-[10px] text-[var(--color-rust)]">{err}</p>
      )}
    </div>
  );
}

/**
 * Re-run fn whenever deps change. The signature stays narrow on purpose:
 * we only need it to keep two pieces of derived state in sync with their
 * source values; we don't return cleanup or take other lifecycle hooks.
 */
function useMemoSync(fn: () => void, deps: ReadonlyArray<unknown>): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(fn, deps);
}
