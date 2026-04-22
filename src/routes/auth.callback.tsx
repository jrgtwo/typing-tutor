import { useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Supabase auth client picks up the code from the URL automatically
      // (detectSessionInUrl: true). Just wait for the session, then route.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        navigate({ to: '/dashboard' });
      } else {
        navigate({ to: '/' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main className="mx-auto max-w-md px-6 py-24 text-center font-mono text-sm text-[var(--color-ink-soft)]">
      Finishing sign in…
    </main>
  );
}
