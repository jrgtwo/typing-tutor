import { StackHandler } from '@stackframe/react';
import { createFileRoute, useLocation } from '@tanstack/react-router';
import { stackClientApp } from '@/lib/stack';

export const Route = createFileRoute('/handler/$')({
  component: HandlerRoute,
});

function HandlerRoute() {
  const location = useLocation();
  return (
    <StackHandler app={stackClientApp} location={location.pathname} fullPage />
  );
}
