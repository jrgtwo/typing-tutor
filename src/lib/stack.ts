import { StackClientApp } from '@stackframe/react';

const projectId = import.meta.env.VITE_STACK_PROJECT_ID;
const publishableClientKey = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;

if (!projectId || !publishableClientKey) {
  console.warn(
    '[stack] VITE_STACK_PROJECT_ID or VITE_STACK_PUBLISHABLE_CLIENT_KEY missing. Auth + data features will fail until set.',
  );
}

export const stackClientApp = new StackClientApp({
  projectId: projectId ?? 'unset',
  publishableClientKey: publishableClientKey ?? 'unset',
  tokenStore: 'cookie',
  urls: {
    handler: '/handler',
    afterSignIn: '/dashboard',
    afterSignUp: '/dashboard',
    afterSignOut: '/',
  },
});

export const stackConfigured = Boolean(projectId && publishableClientKey);
