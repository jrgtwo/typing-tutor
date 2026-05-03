import { createFileRoute } from '@tanstack/react-router';
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

export const Route = createFileRoute('/auth/$pathname')({
  component: AuthRoute,
});

function AuthRoute() {
  const { pathname } = Route.useParams();
  return <AuthView pathname={pathname} />;
}
