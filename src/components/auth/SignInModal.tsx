import { useEffect, useState } from 'react';
import { signInWithGoogle } from '@/lib/auth';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignInModal({ open, onClose }: SignInModalProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.warn('[auth] google sign-in failed', err);
      setError('Sign-in failed. Try again.');
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signin-title"
    >
      <button
        type="button"
        aria-label="Close sign in"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        className="relative w-full max-w-sm rounded-md p-8 shadow-2xl"
        style={{
          background: '#faf2d9',
          color: '#2a1f12',
          boxShadow:
            '0 30px 60px -15px rgba(0,0,0,0.7), 0 8px 16px -4px rgba(0,0,0,0.5)',
        }}
      >
        <p
          id="signin-title"
          className="font-mono text-[10px] uppercase tracking-[0.4em] opacity-60"
        >
          KeyBandit · sign in
        </p>
        <h2 className="mt-2 font-serif text-2xl italic leading-tight">
          Save your runs.
        </h2>
        <p className="mt-2 font-serif text-sm italic opacity-70">
          The raccoon will pretend to recognize you.
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-sm border border-[#2a1f12]/30 bg-white px-4 py-2.5 font-mono text-sm text-[#2a1f12] shadow-sm transition hover:border-[#2a1f12]/60 hover:shadow disabled:opacity-50"
        >
          <GoogleGlyph />
          {busy ? 'Redirecting…' : 'Continue with Google'}
        </button>

        {error && (
          <p className="mt-3 font-mono text-[11px] text-[#c85a4a]">{error}</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 block w-full text-center font-mono text-[10px] uppercase tracking-[0.35em] opacity-60 hover:opacity-100"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
