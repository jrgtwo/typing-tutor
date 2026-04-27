import { useUser as useStackUser } from '@stackframe/react';
import { redirect } from '@tanstack/react-router';
import { stackClientApp } from './stack';

export function useSession() {
  const user = useStackUser();
  const loading = user === undefined;
  return { session: user ?? null, loading };
}

export async function getCurrentUser() {
  return stackClientApp.getUser();
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw redirect({ to: '/' });
  }
  return user;
}

export async function signInWithGoogle() {
  return stackClientApp.signInWithOAuth('google');
}

export async function signInWithMagicLink(email: string) {
  return stackClientApp.sendMagicLinkEmail(email, {
    callbackUrl: `${window.location.origin}/handler/magic-link-callback`,
  });
}

export async function signOut() {
  const user = await stackClientApp.getUser();
  if (user) {
    await user.signOut();
  }
}
