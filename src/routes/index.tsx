import { createFileRoute, Link } from '@tanstack/react-router';
import { AdSlot } from '@/components/ads/AdSlot';
import { SignInButton } from '@/components/auth/SignInButton';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/')({
  component: Landing,
});

const SKINS: Array<{ to: string; label: string; color: string; rotate: number }> = [
  { to: '/practice/desk', label: 'desk', color: '#ffd66b', rotate: -4 },
  { to: '/practice/terminal', label: 'terminal', color: '#9ddaa3', rotate: 3 },
  { to: '/practice/typewriter', label: 'typewriter', color: '#f5a99a', rotate: -2 },
  { to: '/practice/arcade', label: 'arcade', color: '#a8c8ec', rotate: 4 },
  { to: '/practice/focus', label: 'focus', color: '#ffd66b', rotate: -3 },
  { to: '/practice/synth', label: 'synth', color: '#d8a9ec', rotate: 2 },
  { to: '/practice/cockpit', label: 'cockpit', color: '#9ddaa3', rotate: -5 },
  { to: '/practice/karaoke', label: 'karaoke', color: '#f5a99a', rotate: 3 },
  { to: '/practice/chat', label: 'chat', color: '#a8c8ec', rotate: -2 },
];

function Landing() {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-[#f1e4c5]"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 50% 45%, #3a2614 0%, #1d130a 80%)',
      }}
    >
      {/* wood grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'repeating-linear-gradient(87deg, rgba(80,52,28,0.3) 0px, rgba(80,52,28,0.3) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(91deg, rgba(20,12,6,0.5) 0px, rgba(20,12,6,0.5) 1px, transparent 1px, transparent 9px)',
        }}
      />
      {/* lamp pool */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at 50% 42%, rgba(255,210,140,0.22), transparent 70%)',
        }}
      />
      {/* coffee ring stain (decor) */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: '9%',
          top: '14%',
          width: 110,
          height: 110,
          border: '4px solid rgba(60,35,15,0.35)',
          borderRadius: '50%',
          filter: 'blur(1.5px)',
          transform: 'rotate(-12deg)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10">
        <header className="flex items-start justify-between gap-3">
          <IndexCard />
          <SignInButton variant="desk" />
        </header>

        <section className="relative mt-10 grid gap-10 md:grid-cols-[1fr_240px] md:items-start">
          {/* hero notepad */}
          <div
            className="relative mx-auto w-full max-w-[640px]"
            style={{ transform: 'rotate(-0.8deg)' }}
          >
            <Notepad />
          </div>

          {/* sidebar: pick-a-skin stickies */}
          <aside className="relative">
            <p className="mb-4 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-[#f1e4c5]/70">
              pick a skin
            </p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-5 md:grid-cols-1 md:gap-y-4">
              {SKINS.map((s) => (
                <SkinSticky key={s.to} {...s} />
              ))}
            </div>
          </aside>
        </section>

        <footer className="relative mt-16">
          <p className="text-center font-serif text-sm italic text-[#f1e4c5]/70">
            no accounts needed to look around. sign in to track your progress.
          </p>
          <div className="mt-6">
            <AdSlot placement="landing.footer" />
          </div>
        </footer>
      </div>
    </main>
  );
}

function Notepad() {
  return (
    <article
      className="relative rounded-sm pb-12 pl-10 pr-10 pt-14"
      style={{
        backgroundColor: '#faf2d9',
        backgroundImage:
          'repeating-linear-gradient(0deg, rgba(90,70,40,0.08) 0 1px, transparent 1px 32px), linear-gradient(180deg, #faf2d9 0%, #efdfb3 100%)',
        boxShadow:
          '0 3px 0 #d8c28a, 0 6px 0 #c4ab6d, 0 30px 50px -10px rgba(0,0,0,0.6), 0 60px 80px -20px rgba(0,0,0,0.5)',
        color: '#2a1f12',
      }}
    >
      {/* spiral binding bar */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-8 rounded-t-sm"
        style={{
          background: 'linear-gradient(180deg, #6a4820 0%, #3d2a14 100%)',
          boxShadow:
            'inset 0 -2px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,140,0.2)',
        }}
      />
      {/* binding holes */}
      <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-around px-8">
        {Array.from({ length: 9 }).map((_, i) => (
          <span
            key={i}
            className="block h-4 w-4 rounded-full"
            style={{
              background: '#0e0805',
              boxShadow:
                'inset 0 2px 3px rgba(0,0,0,0.9), 0 1px 0 rgba(255,200,140,0.15)',
            }}
          />
        ))}
      </div>

      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-[#5a4020]">
        memo · re: typing
      </p>
      <h1 className="font-serif text-5xl leading-[1.05] text-[#2a1f12]">
        a reluctantly encouraging
        <br />
        <span className="italic" style={{ color: '#c85a4a' }}>
          typing speed gauge.
        </span>
      </h1>
      <p className="mt-5 font-serif text-lg italic leading-relaxed text-[#4a3520]">
        practice on real prose and real code. a sarcastic raccoon will, on
        occasion, applaud you. probably.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Link
          to="/practice"
          className="rounded-sm px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.35em] text-white shadow-md transition-colors hover:brightness-110"
          style={{ background: '#c85a4a' }}
        >
          start typing →
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#5a4020]/70">
          desktop &amp; physical keyboard required
        </span>
      </div>

      {/* paperclip on top-right corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          right: 22,
          top: -10,
          width: 26,
          height: 64,
          borderRadius: 8,
          border: '2px solid #8a8a8a',
          background:
            'linear-gradient(180deg, transparent 0 8%, rgba(180,180,180,0.2) 8% 100%)',
          boxShadow:
            '0 2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)',
          transform: 'rotate(8deg)',
        }}
      />
    </article>
  );
}

function IndexCard() {
  return (
    <div
      className="rounded-sm px-4 py-2"
      style={{
        background: '#f1e4c5',
        color: '#2a1f12',
        boxShadow: '0 6px 12px -4px rgba(0,0,0,0.55)',
        transform: 'rotate(-1.5deg)',
      }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.4em] opacity-60">
        file no. 001 · beta
      </p>
      <p className="font-serif text-base italic">KeyBandit</p>
    </div>
  );
}

function SkinSticky({
  to,
  label,
  color,
  rotate,
}: {
  to: string;
  label: string;
  color: string;
  rotate: number;
}) {
  return (
    <Link
      to={to}
      className={cn(
        'block w-full px-3 py-2 text-center font-serif italic text-[#2a1f12]',
        'transition-transform hover:-translate-y-0.5',
      )}
      style={{
        background: color,
        transform: `rotate(${rotate}deg)`,
        boxShadow:
          '0 12px 20px -8px rgba(0,0,0,0.6), inset 0 -10px 12px -10px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.35)',
      }}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.4em] not-italic opacity-70">
        skin
      </span>
      <p className="text-base">{label}</p>
    </Link>
  );
}
