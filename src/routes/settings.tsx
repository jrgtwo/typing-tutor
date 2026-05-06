import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { PaperPanel } from '@/components/chrome/PaperPanel';
import { SignInModal } from '@/components/auth/SignInModal';
import { useSession } from '@/lib/auth';
import {
  useProfile,
  useUpdateProfile,
  type Profile,
  type RaccoonFrequency,
} from '@/lib/queries';

export const Route = createFileRoute('/settings')({
  component: Settings,
});

const FREQUENCY_OPTIONS: Array<{
  value: RaccoonFrequency;
  label: string;
  blurb: string;
}> = [
  { value: 'chatty', label: 'Chatty', blurb: 'Pops in often. Brace yourself.' },
  { value: 'normal', label: 'Normal', blurb: 'A balanced amount of judgment.' },
  { value: 'rare', label: 'Rare', blurb: 'Only the big moments.' },
  { value: 'off', label: 'Off', blurb: 'No raccoon. No commentary. Quiet.' },
];

function Settings() {
  const { session, loading: authLoading } = useSession();
  const isAuthed = Boolean(session);
  const { data, isLoading, error } = useProfile(isAuthed);

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Header />
      <div className="mt-6 space-y-6">
        {authLoading ? (
          <PaperPanel>
            <p className="font-mono text-xs text-[var(--color-ink-soft)]">
              Loading…
            </p>
          </PaperPanel>
        ) : !isAuthed ? (
          <SignedOutPanel />
        ) : isLoading ? (
          <PaperPanel>
            <p className="font-mono text-xs text-[var(--color-ink-soft)]">
              Pulling your profile…
            </p>
          </PaperPanel>
        ) : error || !data ? (
          <PaperPanel>
            <p className="font-mono text-xs text-[var(--color-rust)]">
              Could not load settings. Try again in a moment.
            </p>
          </PaperPanel>
        ) : (
          <SettingsForm profile={data} />
        )}
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-[var(--color-paper-deep)] pb-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
          KeyBandit · settings
        </p>
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">
          Settings
        </h1>
      </div>
      <Link
        to="/dashboard"
        className="rounded-md border border-[var(--color-paper-deep)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-ink)] hover:border-[var(--color-ink-soft)]"
      >
        ← Dashboard
      </Link>
    </header>
  );
}

function SignedOutPanel() {
  const [open, setOpen] = useState(false);
  return (
    <PaperPanel className="space-y-4">
      <h2 className="font-serif text-xl text-[var(--color-ink)]">
        Settings live behind a sign-in.
      </h2>
      <p className="font-mono text-sm text-[var(--color-ink-soft)]">
        Your display name and raccoon preferences are tied to your account.
        Sign in and they'll show up here.
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

function SettingsForm({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const [displayName, setDisplayName] = useState(profile.display_name ?? '');
  const [frequency, setFrequency] = useState<RaccoonFrequency>(
    profile.preferences.raccoonFrequency ?? 'normal',
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setDisplayName(profile.display_name ?? '');
    setFrequency(profile.preferences.raccoonFrequency ?? 'normal');
  }, [profile.display_name, profile.preferences.raccoonFrequency]);

  const dirty =
    (displayName.trim() || null) !== (profile.display_name ?? null) ||
    frequency !== (profile.preferences.raccoonFrequency ?? 'normal');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty || update.isPending) return;
    const trimmed = displayName.trim();
    update.mutate(
      {
        displayName: trimmed === '' ? null : trimmed,
        preferences: { ...profile.preferences, raccoonFrequency: frequency },
      },
      {
        onSuccess: () => setSavedAt(Date.now()),
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <PaperPanel className="space-y-4">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
            Display name
          </h2>
          <p className="mt-1 font-mono text-xs text-[var(--color-ink-soft)]">
            Shown on your dashboard. The raccoon will not learn it.
          </p>
        </div>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          placeholder="anonymous typist"
          className="w-full rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] px-3 py-2 font-mono text-sm text-[var(--color-ink)] focus:border-[var(--color-ink)] focus:outline-none"
        />
      </PaperPanel>

      <PaperPanel className="space-y-3">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
            Raccoon frequency
          </h2>
          <p className="mt-1 font-mono text-xs text-[var(--color-ink-soft)]">
            How often the mascot should pop in during a session.
          </p>
        </div>
        <fieldset className="space-y-2">
          <legend className="sr-only">Raccoon frequency</legend>
          {FREQUENCY_OPTIONS.map((opt) => {
            const checked = frequency === opt.value;
            return (
              <label
                key={opt.value}
                className={
                  'flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 transition-colors ' +
                  (checked
                    ? 'border-[var(--color-ink)] bg-[var(--color-paper-deep)]/40'
                    : 'border-[var(--color-paper-deep)] hover:border-[var(--color-ink-soft)]')
                }
              >
                <input
                  type="radio"
                  name="raccoonFrequency"
                  value={opt.value}
                  checked={checked}
                  onChange={() => setFrequency(opt.value)}
                  className="mt-1 accent-[var(--color-ink)]"
                />
                <span className="space-y-0.5">
                  <span className="block font-mono text-xs uppercase tracking-wider text-[var(--color-ink)]">
                    {opt.label}
                  </span>
                  <span className="block font-mono text-[11px] text-[var(--color-ink-soft)]">
                    {opt.blurb}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>
      </PaperPanel>

      <div className="flex items-center justify-end gap-4">
        <SaveStatus
          pending={update.isPending}
          error={update.isError}
          savedAt={savedAt}
          dirty={dirty}
        />
        <button
          type="submit"
          disabled={!dirty || update.isPending}
          className="rounded-md bg-[var(--color-ink)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function SaveStatus({
  pending,
  error,
  savedAt,
  dirty,
}: {
  pending: boolean;
  error: boolean;
  savedAt: number | null;
  dirty: boolean;
}) {
  if (pending) return null;
  if (error)
    return (
      <span className="font-mono text-xs text-[var(--color-rust)]">
        Save failed.
      </span>
    );
  if (savedAt && !dirty)
    return (
      <span className="font-mono text-xs text-[var(--color-ink-soft)]">
        Saved.
      </span>
    );
  return null;
}
