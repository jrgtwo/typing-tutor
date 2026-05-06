import { createFileRoute, redirect } from '@tanstack/react-router';

// Desk is the only featured practice variant for now. The other
// /practice/* routes still exist; this just points the bare /practice
// URL at desk so users don't land on the inactive paper picker.
export const Route = createFileRoute('/practice')({
  beforeLoad: () => {
    throw redirect({ to: '/practice/desk' });
  },
});
