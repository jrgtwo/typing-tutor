import { createFileRoute } from '@tanstack/react-router';
import { PaperPanel } from '@/components/chrome/PaperPanel';

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <PaperPanel className="space-y-4">
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="font-mono text-sm text-[var(--color-ink-soft)]">
          Heatmap and history land next.
        </p>
      </PaperPanel>
    </main>
  );
}
