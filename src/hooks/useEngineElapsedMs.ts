import { useEffect, useState } from 'react';
import { useEngineStore } from '@/engine/store';

/**
 * Live elapsed-ms reading off the typing engine. Ticks while the engine is
 * running, freezes at `finishedAt - startedAt` once finished, returns 0 while
 * idle. Each call owns its own setInterval, so consumers can pick a cadence
 * that suits the visual (e.g. 100ms for an arcade scoreboard, 500ms for a
 * sparse meter).
 */
export function useEngineElapsedMs(intervalMs: number = 250): number {
  const status = useEngineStore((s) => s.status);
  const startedAt = useEngineStore((s) => s.startedAt);
  const finishedAt = useEngineStore((s) => s.finishedAt);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [status, intervalMs]);

  if (!startedAt) return 0;
  const end = status === 'finished' ? (finishedAt ?? now) : now;
  return Math.max(0, end - startedAt);
}
