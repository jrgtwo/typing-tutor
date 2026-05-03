import { redirect } from '@tanstack/react-router';
import { authClient } from './auth-client';
import { clearAuthTokenCache } from './api';

export function useSession() {
  const result = authClient.useSession();
  return {
    session: result.data?.user ?? null,
    loading: result.isPending,
  };
}

export async function getCurrentUser() {
  const { data } = await authClient.getSession();
  return data?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw redirect({ to: '/' });
  }
  return user;
}

export async function signOut() {
  await authClient.signOut();
  clearAuthTokenCache();
}

export async function signInWithGoogle(callbackURL?: string) {
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: callbackURL ?? window.location.href,
  });
}
