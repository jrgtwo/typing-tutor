import { Link, useRouterState } from '@tanstack/react-router';
import { Raccoon } from '@/components/mascot/Raccoon';

export function SiteBrand() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === '/' || pathname.startsWith('/auth')) return null;

  return (
    <Link
      to="/"
      aria-label="KeyBandit — home"
      className="fixed left-4 top-4 z-50 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 py-1 pl-1.5 pr-3 text-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors hover:text-white"
    >
      <Raccoon mood="smug" size={22} className="shrink-0" />
      <span className="font-mono text-[11px] uppercase tracking-[0.35em]">
        KeyBandit
      </span>
    </Link>
  );
}
