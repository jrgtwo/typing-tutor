import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

const VARIANTS = [
  { to: '/practice', label: 'paper' },
  { to: '/practice/terminal', label: 'terminal' },
  { to: '/practice/typewriter', label: 'typewriter' },
  { to: '/practice/arcade', label: 'arcade' },
  { to: '/practice/focus', label: 'focus' },
  { to: '/practice/synth', label: 'synth' },
  { to: '/practice/cockpit', label: 'cockpit' },
  { to: '/practice/karaoke', label: 'karaoke' },
  { to: '/practice/chat', label: 'chat' },
  { to: '/practice/desk', label: 'desk' },
] as const;

/**
 * Fixed-position pill shown on every design variant so the user can hop
 * between skins without going back to the landing page. Styled neutrally
 * (translucent backdrop) so it reads on both light and dark themes.
 */
export function DesignNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Design variants"
      className="fixed right-4 top-4 z-50 flex flex-wrap items-center gap-1 rounded-full border border-white/15 bg-black/60 p-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md"
    >
      <span className="px-2 text-white/40">skin ›</span>
      {VARIANTS.map((v) => {
        const active = pathname === v.to;
        return (
          <Link
            key={v.to}
            to={v.to}
            className={cn(
              'rounded-full px-2.5 py-1 transition-colors',
              active
                ? 'bg-white text-black'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            )}
          >
            {v.label}
          </Link>
        );
      })}
    </nav>
  );
}
