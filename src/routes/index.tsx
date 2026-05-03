import { createFileRoute, Link } from '@tanstack/react-router';
import { PaperPanel } from '@/components/chrome/PaperPanel';
import { AdSlot } from '@/components/ads/AdSlot';
import { SignInButton } from '@/components/auth/SignInButton';

export const Route = createFileRoute('/')({
  component: Landing,
});

function Landing() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <PaperPanel className="space-y-8 p-10">
        <header className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
              KeyBandit — beta
            </p>
            <SignInButton />
          </div>
          <h1 className="font-serif text-5xl leading-tight text-[var(--color-ink)]">
            A reluctantly encouraging
            <br />
            <span className="text-[var(--color-amber)]">typing speed gauge.</span>
          </h1>
          <p className="font-serif text-lg text-[var(--color-ink-soft)]">
            Practice on real prose and real code. A sarcastic raccoon will, on
            occasion, applaud you. Probably.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            to="/practice"
            className="rounded-md bg-[var(--color-ink)] px-5 py-2.5 font-mono text-sm uppercase tracking-wider text-[var(--color-paper)] hover:bg-[var(--color-ink-soft)]"
          >
            Start typing
          </Link>
          <span className="font-mono text-xs text-[var(--color-ink-soft)]">
            Desktop &amp; physical keyboard required.
          </span>
        </div>

        <section className="border-t border-[var(--color-paper-deep)] pt-6">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
            Design exploration — pick a skin
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/practice/terminal" className="rounded border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]">terminal</Link>
            <Link to="/practice/typewriter" className="rounded border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]">typewriter</Link>
            <Link to="/practice/arcade" className="rounded border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]">arcade</Link>
            <Link to="/practice/focus" className="rounded border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]">focus</Link>
            <Link to="/practice/synth" className="rounded border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]">synth</Link>
            <Link to="/practice/cockpit" className="rounded border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]">cockpit</Link>
            <Link to="/practice/karaoke" className="rounded border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]">karaoke</Link>
            <Link to="/practice/chat" className="rounded border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]">chat</Link>
            <Link to="/practice/desk" className="rounded border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]">desk</Link>
          </div>
        </section>

        <footer className="border-t border-[var(--color-paper-deep)] pt-6 font-mono text-xs text-[var(--color-ink-soft)]">
          <p>No accounts needed to look around. Sign in to track your progress.</p>
        </footer>
      </PaperPanel>

      <div className="mt-8">
        <AdSlot placement="landing.footer" />
      </div>
    </main>
  );
}
