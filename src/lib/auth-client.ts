import { createAuthClient } from '@neondatabase/neon-js/auth';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  console.warn(
    '[neon-auth] VITE_NEON_AUTH_URL missing. Auth + data features will fail until set.',
  );
}

export const authClient = createAuthClient(authUrl ?? 'unset', {
  adapter: BetterAuthReactAdapter(),
});

export const neonAuthConfigured = Boolean(authUrl);
