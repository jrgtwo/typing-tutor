import { useCallback, useEffect, useRef, useState } from 'react';
import { useEngineStore } from '@/engine/store';
import { persistFinishedSession } from '@/engine/persist';
import { useSession } from '@/lib/auth';
import { SAMPLE_PASSAGES, type SamplePassage } from '@/data/samplePassages';

/**
 * Owns the cross-cutting concerns a typing page needs:
 *  - which sample passage is selected
 *  - loading the engine when the passage changes
 *  - the window-level keydown bridge into the engine
 *  - persisting a finished session to the backend (signed-in only)
 *
 * Everything imperative runs inside a useEffect so design-variant pages
 * only need to worry about layout — not wiring.
 */
export function usePracticeSession() {
  const [index, setIndex] = useState(0);
  const passage: SamplePassage = SAMPLE_PASSAGES[index];

  const load = useEngineStore((s) => s.load);
  const dispatch = useEngineStore((s) => s.dispatch);
  const status = useEngineStore((s) => s.status);

  const { session } = useSession();
  const isAuthed = Boolean(session);

  useEffect(() => {
    load(passage.modeId, passage.body);
  }, [load, passage.modeId, passage.body]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const consumed = isConsumedKey(e.key);
      if (!consumed) return;
      e.preventDefault();
      dispatch({ type: 'keydown', key: e.key, at: performance.timeOrigin + performance.now() });
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dispatch]);

  // Persist on the idle/running → finished transition. Snapshot the store
  // imperatively so we capture the exact end-of-session state, not a stale
  // closure value.
  const persistedRef = useRef<symbol | null>(null);
  const sessionToken = useRef(Symbol());
  useEffect(() => {
    if (status !== 'finished') {
      sessionToken.current = Symbol();
      return;
    }
    if (persistedRef.current === sessionToken.current) return;
    persistedRef.current = sessionToken.current;
    if (!isAuthed) return;
    const snapshot = useEngineStore.getState();
    void persistFinishedSession(snapshot);
  }, [status, isAuthed]);

  const pickPassage = useCallback((i: number) => setIndex(i), []);
  const next = useCallback(
    () => setIndex((i) => (i + 1) % SAMPLE_PASSAGES.length),
    [],
  );
  const reset = useCallback(() => {
    load(passage.modeId, passage.body);
  }, [load, passage.modeId, passage.body]);

  return { index, passage, passages: SAMPLE_PASSAGES, pickPassage, next, reset };
}

function isConsumedKey(key: string): boolean {
  if (key === 'Backspace' || key === 'Tab' || key === 'Enter') return true;
  if (key.length === 1) return true;
  return false;
}
