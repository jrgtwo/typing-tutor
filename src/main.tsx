import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react/ui';

import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/700.css';
import '@fontsource/ibm-plex-serif/400.css';
import '@fontsource/ibm-plex-serif/700.css';

import './styles/globals.css';
import { authClient } from './lib/auth-client';
import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false },
  },
});

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: { queryClient },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <NeonAuthUIProvider
        authClient={authClient}
        social={{ providers: ['google'] }}
        credentials={false}
        signUp={false}
      >
        <RouterProvider router={router} />
      </NeonAuthUIProvider>
    </QueryClientProvider>
  </StrictMode>,
);
