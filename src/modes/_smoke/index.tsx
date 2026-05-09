/**
 * Smoke-test mode. Exists solely to prove the plug-and-play architecture
 * delivers what it promised: drop a folder in `src/modes/<id>/` and the
 * mode appears in the stamp tray AND the admin console with zero edits
 * anywhere outside this folder.
 *
 * Hidden behind a Vite env flag so it never ships to production. To verify,
 * set `VITE_SMOKE_MODE=1` in `.env.local`, run dev, and observe.
 */
import { registerMode } from '../registry';
import type { HudProps, SessionMode } from '../types';

interface HelloConfig {
  greeting: string;
}

interface HelloState {
  ticks: number;
}

const helloMode: SessionMode<HelloState, HelloConfig> = {
  id: 'smoke-hello',
  label: 'Hello',
  description: 'Smoke test. Should disappear in production.',
  stamp: { label: 'HI', inkColor: '#5b8c3a', frame: 'plain' },
  difficulties: {
    easy:   { greeting: 'hi' },
    medium: { greeting: 'hello' },
    hard:   { greeting: 'howdy' },
    ngplus: { greeting: 'hey there partner' },
  },
  validateConfig(raw) {
    if (raw == null || typeof raw !== 'object') return { error: 'config must be a JSON object' };
    const r = raw as Record<string, unknown>;
    if (typeof r.greeting !== 'string') return { error: 'greeting must be a string' };
    return { ok: { greeting: r.greeting } };
  },
  initial() {
    return { ticks: 0 };
  },
  isComplete() {
    return false;
  },
  finalScore() {
    return {
      primary: 0,
      primaryLabel: 'hi',
      details: [],
    };
  },
  HudComponent: HelloHud,
};

function HelloHud({ difficulty }: HudProps<HelloState, HelloConfig>) {
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-sm bg-[#5b8c3a]/85 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.4em] text-[#f7ead0]"
      style={{ left: '20%', bottom: -28, transform: 'rotate(-3deg)' }}
    >
      {difficulty.greeting}
    </div>
  );
}

if (import.meta.env.VITE_SMOKE_MODE === '1') {
  registerMode(helloMode);
}
