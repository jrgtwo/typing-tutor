import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { PaperPanel } from '@/components/chrome/PaperPanel';
import { SignInModal } from '@/components/auth/SignInModal';
import { useSession } from '@/lib/auth';
import {
  ForbiddenError,
  useAdminContent,
  useCreateContent,
  useUpdateContent,
  type AdminContentItem,
  type AdminContentInput,
} from '@/lib/queries';

export const Route = createFileRoute('/admin')({
  component: Admin,
});

type DraftMode = { kind: 'create' } | { kind: 'edit'; item: AdminContentItem };

function Admin() {
  const { session, loading: authLoading } = useSession();
  const isAuthed = Boolean(session);
  const query = useAdminContent(isAuthed);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="border-b border-[var(--color-paper-deep)] pb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
          KeyBandit · admin
        </p>
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">
          Content catalog
        </h1>
      </header>

      <div className="mt-6">
        {authLoading ? (
          <PaperPanel>
            <p className="font-mono text-xs text-[var(--color-ink-soft)]">
              Loading…
            </p>
          </PaperPanel>
        ) : !isAuthed ? (
          <SignedOutPanel />
        ) : query.error instanceof ForbiddenError ? (
          <ForbiddenPanel />
        ) : query.isLoading ? (
          <PaperPanel>
            <p className="font-mono text-xs text-[var(--color-ink-soft)]">
              Pulling catalog…
            </p>
          </PaperPanel>
        ) : query.error ? (
          <PaperPanel>
            <p className="font-mono text-xs text-[var(--color-rust)]">
              Could not load the catalog. Try again in a moment.
            </p>
          </PaperPanel>
        ) : (
          <AdminBoard items={query.data ?? []} />
        )}
      </div>
    </main>
  );
}

function SignedOutPanel() {
  const [open, setOpen] = useState(false);
  return (
    <PaperPanel className="space-y-4">
      <h2 className="font-serif text-xl text-[var(--color-ink)]">
        Admins only.
      </h2>
      <p className="font-mono text-sm text-[var(--color-ink-soft)]">
        Sign in to continue. The raccoon won't argue about it.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-[var(--color-ink)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)]"
      >
        Sign in
      </button>
      <SignInModal open={open} onClose={() => setOpen(false)} />
    </PaperPanel>
  );
}

function ForbiddenPanel() {
  return (
    <PaperPanel className="space-y-3">
      <h2 className="font-serif text-xl text-[var(--color-ink)]">
        Nothing here for you.
      </h2>
      <p className="font-mono text-sm text-[var(--color-ink-soft)]">
        Your account doesn't have access to this page.
      </p>
    </PaperPanel>
  );
}

function AdminBoard({ items }: { items: AdminContentItem[] }) {
  const [draft, setDraft] = useState<DraftMode>({ kind: 'create' });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <PaperPanel className="space-y-3">
        <header className="flex items-center justify-between">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
            {items.length} item{items.length === 1 ? '' : 's'}
          </h2>
          <button
            type="button"
            onClick={() => setDraft({ kind: 'create' })}
            className="rounded-md border border-[var(--color-paper-deep)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--color-ink)] hover:border-[var(--color-ink-soft)]"
          >
            + new
          </button>
        </header>
        <CatalogTable
          items={items}
          activeId={draft.kind === 'edit' ? draft.item.id : null}
          onEdit={(item) => setDraft({ kind: 'edit', item })}
        />
      </PaperPanel>

      <ContentForm
        key={draft.kind === 'edit' ? draft.item.id : 'new'}
        draft={draft}
        onSaved={() => setDraft({ kind: 'create' })}
      />
    </div>
  );
}

function CatalogTable({
  items,
  activeId,
  onEdit,
}: {
  items: AdminContentItem[];
  activeId: string | null;
  onEdit: (item: AdminContentItem) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="font-mono text-xs text-[var(--color-ink-soft)]">
        No content yet. Add the first passage on the right.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
            <th className="py-2 pr-3">Title</th>
            <th className="py-2 pr-3">Type</th>
            <th className="py-2 pr-3">Lang</th>
            <th className="py-2 pr-3 text-right">Diff</th>
            <th className="py-2 pr-3 text-right">Chars</th>
            <th className="py-2 pr-3">Active</th>
            <th className="py-2 sr-only">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr
              key={it.id}
              className={
                'border-t border-[var(--color-paper-deep)] ' +
                (activeId === it.id
                  ? 'bg-[var(--color-paper-deep)]/40'
                  : '')
              }
            >
              <td className="py-2 pr-3 text-[var(--color-ink)]">{it.title}</td>
              <td className="py-2 pr-3 text-[var(--color-ink-soft)]">
                {it.type}
              </td>
              <td className="py-2 pr-3 text-[var(--color-ink-soft)]">
                {it.language ?? '—'}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {it.difficulty}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-[var(--color-ink-soft)]">
                {it.length_chars}
              </td>
              <td className="py-2 pr-3">
                {it.is_active ? (
                  <span className="text-[var(--color-ink)]">on</span>
                ) : (
                  <span className="text-[var(--color-rust)]">off</span>
                )}
              </td>
              <td className="py-2 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(it)}
                  className="rounded border border-[var(--color-paper-deep)] px-2 py-0.5 text-[10px] uppercase tracking-wider hover:border-[var(--color-ink-soft)]"
                >
                  edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface FormState {
  type: 'prose' | 'code';
  title: string;
  body: string;
  language: string;
  source: string;
  difficulty: number;
  isActive: boolean;
}

function emptyState(): FormState {
  return {
    type: 'prose',
    title: '',
    body: '',
    language: '',
    source: '',
    difficulty: 3,
    isActive: true,
  };
}

function fromItem(item: AdminContentItem): FormState {
  return {
    type: item.type,
    title: item.title,
    body: item.body,
    language: item.language ?? '',
    source: item.source ?? '',
    difficulty: item.difficulty,
    isActive: item.is_active,
  };
}

function ContentForm({
  draft,
  onSaved,
}: {
  draft: DraftMode;
  onSaved: () => void;
}) {
  const initial = useMemo(
    () => (draft.kind === 'edit' ? fromItem(draft.item) : emptyState()),
    [draft],
  );
  const [form, setForm] = useState<FormState>(initial);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setForm(initial);
    setFeedback(null);
  }, [initial]);

  const create = useCreateContent();
  const update = useUpdateContent();
  const pending = create.isPending || update.isPending;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function buildInput(): AdminContentInput {
    return {
      type: form.type,
      title: form.title,
      body: form.body,
      language: form.type === 'code' ? form.language || null : null,
      source: form.source || null,
      difficulty: form.difficulty,
      isActive: form.isActive,
    };
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    const input = buildInput();
    if (!input.title.trim() || !input.body.trim()) {
      setFeedback('Title and body are required.');
      return;
    }
    if (draft.kind === 'create') {
      create.mutate(input, {
        onSuccess: () => {
          setFeedback('Created.');
          onSaved();
        },
        onError: (err) => setFeedback(err.message),
      });
    } else {
      update.mutate(
        { id: draft.item.id, patch: input },
        {
          onSuccess: () => setFeedback('Saved.'),
          onError: (err) => setFeedback(err.message),
        },
      );
    }
  }

  return (
    <PaperPanel className="space-y-4">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
        {draft.kind === 'create' ? 'New passage' : `Editing · ${draft.item.title}`}
      </h2>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select
              value={form.type}
              onChange={(e) => set('type', e.target.value as 'prose' | 'code')}
              className="w-full rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink)]"
            >
              <option value="prose">prose</option>
              <option value="code">code</option>
            </select>
          </Field>
          <Field label="Difficulty (1–5)">
            <input
              type="number"
              min={1}
              max={5}
              value={form.difficulty}
              onChange={(e) =>
                set('difficulty', Math.max(1, Math.min(5, Number(e.target.value) || 3)))
              }
              className="w-full rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-2 py-1.5 font-mono text-sm text-[var(--color-ink)]"
            />
          </Field>
        </div>

        <Field label="Title">
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            maxLength={200}
            className="w-full rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-3 py-1.5 font-mono text-sm text-[var(--color-ink)]"
          />
        </Field>

        <Field label="Body">
          <textarea
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            rows={form.type === 'code' ? 16 : 8}
            spellCheck={form.type === 'prose'}
            className="w-full resize-y rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-3 py-2 font-mono text-[13px] leading-relaxed text-[var(--color-ink)]"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Language (code only)">
            <input
              type="text"
              value={form.language}
              onChange={(e) => set('language', e.target.value)}
              placeholder={form.type === 'code' ? 'javascript' : '—'}
              disabled={form.type !== 'code'}
              className="w-full rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-3 py-1.5 font-mono text-sm text-[var(--color-ink)] disabled:opacity-40"
            />
          </Field>
          <Field label="Source (optional)">
            <input
              type="text"
              value={form.source}
              onChange={(e) => set('source', e.target.value)}
              placeholder="John Masefield, classic, …"
              className="w-full rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-3 py-1.5 font-mono text-sm text-[var(--color-ink)]"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="accent-[var(--color-ink)]"
          />
          <span className="font-mono text-xs text-[var(--color-ink)]">
            Active (visible to typers)
          </span>
        </label>

        <div className="flex items-center justify-between gap-3">
          <span
            className={
              'font-mono text-xs ' +
              (feedback?.startsWith('Saved') || feedback?.startsWith('Created')
                ? 'text-[var(--color-ink-soft)]'
                : 'text-[var(--color-rust)]')
            }
          >
            {feedback ?? ''}
          </span>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-[var(--color-ink)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {pending
              ? draft.kind === 'create'
                ? 'Creating…'
                : 'Saving…'
              : draft.kind === 'create'
                ? 'Create'
                : 'Save'}
          </button>
        </div>
      </form>
    </PaperPanel>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
        {label}
      </span>
      {children}
    </label>
  );
}
