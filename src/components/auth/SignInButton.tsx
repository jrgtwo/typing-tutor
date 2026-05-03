import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useSession, signOut } from '@/lib/auth';
import { neonAuthConfigured } from '@/lib/auth-client';
import { SignInModal } from './SignInModal';
import { cn } from '@/lib/utils';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface SignInButtonProps {
  className?: string;
  /** Visual treatment: chrome (light pill) or desk (cream pill on dark wood). */
  variant?: 'chrome' | 'desk';
}

export function SignInButton({ className, variant = 'chrome' }: SignInButtonProps) {
  const { session, loading } = useSession();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (!neonAuthConfigured) return null;
  if (loading) {
    return (
      <span
        className={cn(
          'inline-block h-6 w-20 rounded-full opacity-40',
          variant === 'desk' ? 'bg-[#f1e4c5]/40' : 'bg-[var(--color-paper-deep)]',
          className,
        )}
      />
    );
  }

  if (!session) {
    return (
      <>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={cn(
            variant === 'desk'
              ? 'rounded-full bg-[#f1e4c5]/90 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#2a1f12] shadow-md hover:bg-white'
              : 'rounded-md border border-[var(--color-paper-deep)] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[var(--color-ink)] hover:border-[var(--color-ink-soft)]',
            className,
          )}
        >
          Sign in
        </button>
        <SignInModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  const user = session as User;
  const label = user.name || user.email || 'account';
  const initials = (user.name || user.email || '?')
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2',
          variant === 'desk'
            ? 'rounded-full bg-[#f1e4c5]/90 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.35em] text-[#2a1f12] shadow-md hover:bg-white'
            : 'rounded-md border border-[var(--color-paper-deep)] px-2 py-1 font-mono text-xs text-[var(--color-ink)] hover:border-[var(--color-ink-soft)]',
        )}
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
              variant === 'desk'
                ? 'bg-[#2a1f12] text-[#f1e4c5]'
                : 'bg-[var(--color-ink)] text-[var(--color-paper)]',
            )}
          >
            {initials}
          </span>
        )}
        <span className="max-w-[140px] truncate normal-case tracking-normal">
          {label}
        </span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute right-0 z-50 mt-2 w-44 rounded-md border border-[var(--color-paper-deep)] bg-[var(--color-paper)] py-1 shadow-lg"
          >
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 font-mono text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOut();
              }}
              className="block w-full px-3 py-2 text-left font-mono text-xs text-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
