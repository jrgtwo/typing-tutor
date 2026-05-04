import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { PaperPanel } from '@/components/chrome/PaperPanel';
import { AdSlot } from '@/components/ads/AdSlot';
import { KeyHeatmap } from '@/components/analytics/KeyHeatmap';
import { WpmChart } from '@/components/analytics/WpmChart';
import { SignInModal } from '@/components/auth/SignInModal';
import { useSession } from '@/lib/auth';
import { useDashboard, type DashboardSession } from '@/lib/queries';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const { session, loading: authLoading } = useSession();
  const isAuthed = Boolean(session);
  const { data, isLoading, error } = useDashboard(isAuthed);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <DashboardHeader />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
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
                Pulling your runs…
              </p>
            </PaperPanel>
          ) : error ? (
            <PaperPanel>
              <p className="font-mono text-xs text-[var(--color-rust)]">
                Could not load your runs. Try again in a moment.
              </p>
            </PaperPanel>
          ) : !data || data.sessions.length === 0 ? (
            <EmptyPanel />
          ) : (
            <DashboardContent data={data} />
          )}
        </div>
        <aside className="space-y-4">
          <AdSlot placement="dashboard.sidebar" />
        </aside>
      </div>
    </main>
  );
}

function DashboardHeader() {
  return (
    <header className="flex items-end justify-between gap-4 border-b border-[var(--color-paper-deep)] pb-4">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
          KeyBandit · ledger
        </p>
        <h1 className="font-serif text-3xl text-[var(--color-ink)]">
          Your runs
        </h1>
      </div>
      <Link
        to="/practice/desk"
        className="rounded-md bg-[var(--color-ink)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)]"
      >
        New passage
      </Link>
    </header>
  );
}

function SignedOutPanel() {
  const [open, setOpen] = useState(false);
  return (
    <PaperPanel className="space-y-4">
      <h2 className="font-serif text-xl text-[var(--color-ink)]">
        No ledger without a name on it.
      </h2>
      <p className="font-mono text-sm text-[var(--color-ink-soft)]">
        The raccoon won't track your runs anonymously. Sign in and they'll
        show up here, automatically, after you finish typing.
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

function EmptyPanel() {
  return (
    <PaperPanel className="space-y-3">
      <h2 className="font-serif text-xl text-[var(--color-ink)]">
        Nothing here yet.
      </h2>
      <p className="font-mono text-sm text-[var(--color-ink-soft)]">
        Finish a passage and it'll land here — with a heatmap that grows
        progressively more accusatory.
      </p>
      <Link
        to="/practice/desk"
        className="inline-block rounded-md border border-[var(--color-paper-deep)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--color-ink)] hover:border-[var(--color-ink-soft)]"
      >
        Try a passage →
      </Link>
    </PaperPanel>
  );
}

function DashboardContent({
  data,
}: {
  data: { sessions: DashboardSession[]; keyStats: import('@/lib/queries').DashboardKeyStat[] };
}) {
  const summary = useMemo(() => summarize(data.sessions), [data.sessions]);
  // Chart wants oldest → newest; the API returns newest first.
  const chronological = useMemo(
    () => [...data.sessions].reverse(),
    [data.sessions],
  );
  const wpms = chronological
    .map((s) => Number(s.wpm))
    .filter((n) => Number.isFinite(n));
  const finishedAtIso = chronological.map((s) => s.finished_at);

  return (
    <div className="space-y-6">
      <PaperPanel>
        <SummaryStats summary={summary} />
      </PaperPanel>

      <PaperPanel className="space-y-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
          WPM over last {wpms.length} {wpms.length === 1 ? 'run' : 'runs'}
        </h2>
        {wpms.length >= 2 ? (
          <WpmChart values={wpms} finishedAtIso={finishedAtIso} />
        ) : (
          <p className="font-mono text-xs text-[var(--color-ink-soft)]">
            Two runs and a chart appears.
          </p>
        )}
      </PaperPanel>

      <PaperPanel className="space-y-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
          Lifetime keyboard heatmap
        </h2>
        {data.keyStats.length === 0 ? (
          <p className="font-mono text-xs text-[var(--color-ink-soft)]">
            Per-key stats build up as you type.
          </p>
        ) : (
          <KeyHeatmap stats={data.keyStats} />
        )}
      </PaperPanel>

      <PaperPanel className="space-y-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--color-ink-soft)]">
          Recent runs
        </h2>
        <RecentRunsTable sessions={data.sessions} />
      </PaperPanel>
    </div>
  );
}

interface Summary {
  total: number;
  bestWpm: number;
  avgWpm: number;
  avgAccuracy: number;
}

function summarize(sessions: DashboardSession[]): Summary {
  const wpms: number[] = [];
  const accs: number[] = [];
  for (const s of sessions) {
    const w = Number(s.wpm);
    const a = Number(s.accuracy);
    if (Number.isFinite(w)) wpms.push(w);
    if (Number.isFinite(a)) accs.push(a);
  }
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return {
    total: sessions.length,
    bestWpm: wpms.length ? Math.max(...wpms) : 0,
    avgWpm: wpms.length ? sum(wpms) / wpms.length : 0,
    avgAccuracy: accs.length ? sum(accs) / accs.length : 0,
  };
}

function SummaryStats({ summary }: { summary: Summary }) {
  const items = [
    { label: 'runs', value: summary.total.toString() },
    { label: 'best wpm', value: summary.bestWpm.toFixed(0) },
    { label: 'avg wpm', value: summary.avgWpm.toFixed(0) },
    {
      label: 'avg accuracy',
      value: `${(summary.avgAccuracy * 100).toFixed(0)}%`,
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label}>
          <dt className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
            {it.label}
          </dt>
          <dd className="mt-1 font-serif text-3xl tabular-nums text-[var(--color-ink)]">
            {it.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RecentRunsTable({ sessions }: { sessions: DashboardSession[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
            <th className="py-2 pr-4">When</th>
            <th className="py-2 pr-4">Mode</th>
            <th className="py-2 pr-4 text-right">WPM</th>
            <th className="py-2 pr-4 text-right">Acc</th>
            <th className="py-2 text-right">Time</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr
              key={s.id}
              className="border-t border-[var(--color-paper-deep)] text-[var(--color-ink)]"
            >
              <td className="py-2 pr-4 text-[var(--color-ink-soft)]">
                {formatRelative(s.finished_at)}
              </td>
              <td className="py-2 pr-4">{s.mode}</td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {Number(s.wpm).toFixed(0)}
              </td>
              <td className="py-2 pr-4 text-right tabular-nums">
                {(Number(s.accuracy) * 100).toFixed(0)}%
              </td>
              <td className="py-2 text-right tabular-nums text-[var(--color-ink-soft)]">
                {formatDuration(s.duration_ms)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '—';
  const diff = now - t;
  const min = Math.round(diff / 60_000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDuration(ms: number | null): string {
  if (!ms || !Number.isFinite(ms)) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}m ${r}s`;
}
