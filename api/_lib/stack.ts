import { StackServerApp } from '@stackframe/react';

const projectId = process.env.VITE_STACK_PROJECT_ID;
const publishableClientKey = process.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;
const secretServerKey = process.env.STACK_SECRET_SERVER_KEY;

if (!projectId || !publishableClientKey || !secretServerKey) {
  throw new Error(
    '[stack] Missing one of VITE_STACK_PROJECT_ID, VITE_STACK_PUBLISHABLE_CLIENT_KEY, STACK_SECRET_SERVER_KEY',
  );
}

export const stackServerApp = new StackServerApp({
  projectId,
  publishableClientKey,
  secretServerKey,
  tokenStore: 'cookie',
});
