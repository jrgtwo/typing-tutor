import { createFileRoute, Link } from '@tanstack/react-router';
import { TypingSession } from '@/components/typing/TypingSession';
import { DesignNav } from '@/components/DesignNav';
import { RaccoonCameos } from '@/components/mascot/RaccoonCameos';
import { SignInButton } from '@/components/auth/SignInButton';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/practice')({
  component: Practice,
});

function Practice() {
  const { index, passage, passages, pickPassage, next, reset } = usePracticeSession();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <DesignNav />
      <RaccoonCameos />
      <header className="mb-8 flex items-center justify-between gap-4">
        <Link to="/" className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
          ← back
        </Link>
        <h1 className="font-serif text-2xl">
          {passage.title}
          {passage.source && (
            <span className="ml-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">
              · {passage.source}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--color-ink-soft)]">
            {passage.modeId}
          </span>
          <SignInButton />
        </div>
      </header>

      <TypingSession onReset={reset} onNext={next} />

      <footer className="mt-10">
        <h2 className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-ink-soft)]">
          Pick another
        </h2>
        <div className="flex flex-wrap gap-2">
          {passages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pickPassage(i)}
              className={cn(
                'rounded border px-3 py-1.5 font-mono text-xs',
                i === index
                  ? 'border-[var(--color-amber)] bg-[var(--color-amber)]/15 text-[var(--color-ink)]'
                  : 'border-[var(--color-paper-deep)] bg-[var(--color-paper)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]',
              )}
            >
              {p.title}
            </button>
          ))}
        </div>
      </footer>
    </main>
  );
}
