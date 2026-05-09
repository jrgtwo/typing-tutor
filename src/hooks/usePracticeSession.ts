import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useEngineStore } from '@/engine/store';
import { persistFinishedSession } from '@/engine/persist';
import { useSession } from '@/lib/auth';
import { useContent } from '@/lib/queries';
import { SAMPLE_PASSAGES, type SamplePassage } from '@/data/samplePassages';
import {
  DIFFICULTY_LEVELS,
  getMode,
  hasMode,
  listModes,
  type Difficulty,
  type FinalScore,
  type SessionMode,
} from '@/modes';
import { useModeConfigs } from '@/lib/queries';

const STORAGE_KEY_MODE = 'keybandit:active-mode';
const STORAGE_KEY_DIFF = 'keybandit:difficulty-by-mode';
const TICK_INTERVAL_MS = 200;
const PASSAGE_INTERMISSION_MS = 750;

interface ModeChoice {
  modeId: string;
  difficulty: Difficulty;
}

/**
 * Owns the cross-cutting concerns a typing page needs:
 *  - which passage is selected (remote when /api/content responds, local fallback otherwise)
 *  - which gameplay mode + difficulty is active (persisted in localStorage)
 *  - loading the engine when the passage changes
 *  - the window-level keydown bridge into the engine
 *  - mode lifecycle (onKeystroke, onTick, isComplete, onPassageRefill)
 *  - persisting a finished session to the backend (signed-in only)
 *
 * Variant pages (Desk, etc.) only worry about layout — not wiring.
 */
export function usePracticeSession() {
  const [index, setIndex] = useState(0);
  const [passages, setPassages] = useState<SamplePassage[]>(SAMPLE_PASSAGES);
  // refillCount bumps every time the orchestrator advances to a new
  // passage during a single round (Race the Clock auto-refill, Sprint
  // chained passages, Drill regenerated text). Modes that override the
  // passage use it as a seed so they don't keep returning the same body.
  const [refillCount, setRefillCount] = useState(0);

  const load = useEngineStore((s) => s.load);
  const dispatch = useEngineStore((s) => s.dispatch);
  const status = useEngineStore((s) => s.status);

  const { session } = useSession();
  const isAuthed = Boolean(session);
  const queryClient = useQueryClient();

  // ── mode + difficulty selection ────────────────────────────────────────
  const [choice, setChoice] = useState<ModeChoice>(() => loadInitialChoice());
  const activeMode = useMemo(
    () => getMode(choice.modeId) ?? listModes()[0]!,
    [choice.modeId],
  );

  // Effective difficulty config: code defaults overlaid with admin DB overrides.
  const { data: dbConfigs } = useModeConfigs();
  const effectiveConfig = useMemo(() => {
    const base = activeMode.difficulties[choice.difficulty];
    const override = dbConfigs?.[activeMode.id]?.[choice.difficulty];
    return override ? { ...base, ...override } : base;
  }, [activeMode, choice.difficulty, dbConfigs]);

  // ── mode session state ─────────────────────────────────────────────────
  const [modeState, setModeState] = useState<unknown>(() => activeMode.initial(effectiveConfig));
  const [sessionDone, setSessionDone] = useState(false);
  const [finalScore, setFinalScore] = useState<FinalScore | null>(null);
  // sessionStartedAt is wall-clock ms set on the first keystroke of a round,
  // and only cleared on session-token bump. This is what mode lifecycle
  // hooks see as `elapsedMs` so that auto-refilling the engine (which
  // resets engine.startedAt) doesn't restart Race the Clock's timer.
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  // True while the orchestrator is showing a brief beat between passage
  // refills — engine still says 'finished', the mode session is alive,
  // and the variant can render an intermission overlay.
  const [intermission, setIntermission] = useState(false);
  // session token bumps every time we (re)start a session — used to scope
  // tick effects to a single session and discard late updates.
  const [sessionToken, setSessionToken] = useState(0);

  // ── refs mirror the latest values of state used inside event handlers.
  // Declared up here so any hook below — including the passage useMemo
  // for getPassageOverride — can read them without TDZ issues.
  const modeStateRef = useRef(modeState);
  useEffect(() => {
    modeStateRef.current = modeState;
  }, [modeState]);
  const sessionDoneRef = useRef(sessionDone);
  useEffect(() => {
    sessionDoneRef.current = sessionDone;
  }, [sessionDone]);
  const sessionStartedAtRef = useRef(sessionStartedAt);
  useEffect(() => {
    sessionStartedAtRef.current = sessionStartedAt;
  }, [sessionStartedAt]);
  const intermissionRef = useRef(intermission);
  useEffect(() => {
    intermissionRef.current = intermission;
  }, [intermission]);

  // Reset mode session state whenever the mode or difficulty changes (NOT
  // on passage change — Race the Clock keeps its session alive across
  // passages while auto-refilling).
  useEffect(() => {
    setModeState(activeMode.initial(effectiveConfig));
    setSessionDone(false);
    setFinalScore(null);
    setSessionStartedAt(null);
    setIntermission(false);
    setRefillCount(0);
    setSessionToken((t) => t + 1);
  }, [activeMode, effectiveConfig]);

  // ── remote content adoption ────────────────────────────────────────────
  const { data: remote } = useContent();
  useEffect(() => {
    if (!remote || remote.length === 0) return;
    if (status === 'running') return;
    if (passages === remote) return;
    setPassages(remote);
    setIndex((i) => (i >= remote.length ? 0 : i));
  }, [remote, status, passages]);

  // ── compute the active passage (mode override OR catalog selection) ───
  const catalogPassage: SamplePassage = passages[index] ?? passages[0];
  const passage: SamplePassage = useMemo(() => {
    if (activeMode.getPassageOverride) {
      const override = activeMode.getPassageOverride(
        // We pass the latest state via ref to avoid making this dependent on
        // every modeState change. The override must be deterministic given
        // (config, refillCount) for the same mode session.
        modeStateRef.current,
        effectiveConfig,
        refillCount,
      );
      if (override) {
        return {
          id: override.id,
          modeId: override.modeId,
          title: override.title,
          body: override.body,
        };
      }
    }
    return catalogPassage;
    // modeStateRef is intentionally not in deps — overrides should be
    // determined by config+refillCount, not arbitrary mode state churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, effectiveConfig, refillCount, catalogPassage]);

  // ── engine load on passage change ──────────────────────────────────────
  useEffect(() => {
    load(passage.modeId, passage.body);
  }, [load, passage.modeId, passage.body]);

  // ── keydown bridge + onKeystroke + blockBackspace + isComplete ─────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (sessionDoneRef.current) return;
      // Swallow keystrokes during the inter-passage beat — the engine has
      // an old finished passage loaded and we don't want stray input
      // counted on the next one before the swap.
      if (intermissionRef.current) {
        if (isConsumedKey(e.key)) e.preventDefault();
        return;
      }
      const consumed = isConsumedKey(e.key);
      if (!consumed) return;

      // Pre-dispatch: snapshot engine state so we can detect what changed.
      const before = useEngineStore.getState();
      const isBackspace = e.key === 'Backspace';

      // Mode-level backspace block (Survival NG+).
      if (isBackspace && activeMode.blockBackspace) {
        const ctx = makeCtx(before, sessionStartedAtRef.current);
        if (activeMode.blockBackspace(modeStateRef.current, ctx, effectiveConfig)) {
          e.preventDefault();
          return;
        }
      }

      e.preventDefault();
      dispatch({
        type: 'keydown',
        key: e.key,
        at: performance.timeOrigin + performance.now(),
      });

      // First-keystroke-of-the-session bookkeeping for round elapsed time.
      if (sessionStartedAtRef.current == null) {
        const t = Date.now();
        sessionStartedAtRef.current = t;
        setSessionStartedAt(t);
      }

      // Post-dispatch: run mode keystroke hook with fresh engine state.
      if (activeMode.onKeystroke) {
        const after = useEngineStore.getState();
        const ctx = makeCtx(after, sessionStartedAtRef.current);
        const correct = after.charsCorrect > before.charsCorrect;
        const next = activeMode.onKeystroke(
          modeStateRef.current,
          ctx,
          { key: e.key, correct, isBackspace },
          effectiveConfig,
        );
        if (next !== modeStateRef.current) {
          modeStateRef.current = next;
          setModeState(next);
        }
      }

      // Synchronous completion check after a keystroke.
      const after = useEngineStore.getState();
      const ctx = makeCtx(after, sessionStartedAtRef.current);
      if (activeMode.isComplete(modeStateRef.current, ctx, effectiveConfig)) {
        endSession(activeMode, modeStateRef.current, ctx, effectiveConfig);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // sessionToken bump on session restart re-binds and clears stale closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, effectiveConfig, dispatch, sessionToken]);

  // ── tick: drives time-based completion + onTick ────────────────────────
  // We always run the heartbeat while a session is active; the cost is one
  // setInterval and the body short-circuits via sessionStartedAt. Modes
  // without onTick still benefit because we re-check `isComplete` here for
  // any time-driven end conditions.
  useEffect(() => {
    if (sessionDone) return;

    const id = window.setInterval(() => {
      if (sessionDoneRef.current) return;
      // Don't tick before the user starts typing; do tick during an
      // inter-passage intermission so time-based modes keep counting.
      if (sessionStartedAtRef.current == null) return;

      const engine = useEngineStore.getState();
      const ctx = makeCtx(engine, sessionStartedAtRef.current);
      if (activeMode.onTick) {
        const next = activeMode.onTick(
          modeStateRef.current,
          ctx,
          TICK_INTERVAL_MS,
          effectiveConfig,
        );
        if (next !== modeStateRef.current) {
          modeStateRef.current = next;
          setModeState(next);
        }
      }
      if (activeMode.isComplete(modeStateRef.current, ctx, effectiveConfig)) {
        endSession(activeMode, modeStateRef.current, ctx, effectiveConfig);
      }
    }, TICK_INTERVAL_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, effectiveConfig, sessionToken, sessionDone]);

  // ── passage-finish handling: refill (with a short beat) or end ─────────
  useEffect(() => {
    if (status !== 'finished') return;
    if (sessionDoneRef.current) return;
    const engine = useEngineStore.getState();
    const ctx = makeCtx(engine, sessionStartedAtRef.current);
    if (
      activeMode.shouldRefillPassage &&
      activeMode.shouldRefillPassage(modeStateRef.current, ctx, effectiveConfig)
    ) {
      // Hold for a short beat so the user feels the passage end, the
      // raccoon has time to peek, and the next passage doesn't snap in
      // mid-keystroke. Roll mode stats forward immediately so the HUD
      // reflects the completed-passage totals during the beat.
      if (activeMode.onPassageRefill) {
        const nextState = activeMode.onPassageRefill(modeStateRef.current, ctx, effectiveConfig);
        modeStateRef.current = nextState;
        setModeState(nextState);
      }
      setIntermission(true);
      intermissionRef.current = true;
      const timer = window.setTimeout(() => {
        // Re-check completion: the timer might have run out during the
        // beat, in which case we don't want to advance — just end.
        const engineNow = useEngineStore.getState();
        const ctxNow = makeCtx(engineNow, sessionStartedAtRef.current);
        intermissionRef.current = false;
        setIntermission(false);
        if (sessionDoneRef.current) return;
        if (activeMode.isComplete(modeStateRef.current, ctxNow, effectiveConfig)) {
          endSession(activeMode, modeStateRef.current, ctxNow, effectiveConfig);
          return;
        }
        setRefillCount((r) => r + 1);
        setIndex((i) => (i + 1) % passages.length);
      }, PASSAGE_INTERMISSION_MS);
      return () => window.clearTimeout(timer);
    }
    endSession(activeMode, modeStateRef.current, ctx, effectiveConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, activeMode, effectiveConfig, passages.length]);

  // ── persistence on natural finish ──────────────────────────────────────
  const persistedRef = useRef(0);
  useEffect(() => {
    if (status !== 'finished') return;
    if (persistedRef.current === sessionToken) return;
    persistedRef.current = sessionToken;
    if (!isAuthed) return;
    const snapshot = useEngineStore.getState();
    void persistFinishedSession(snapshot).then(() => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });
  }, [status, isAuthed, queryClient, sessionToken]);

  // ── helpers callable from the variant ──────────────────────────────────
  function endSession(
    mode: SessionMode<any, any>,
    state: unknown,
    ctx: ReturnType<typeof makeCtx>,
    config: unknown,
  ) {
    if (sessionDoneRef.current) return;
    sessionDoneRef.current = true;
    setSessionDone(true);
    setFinalScore(mode.finalScore(state, ctx, config));
    // Stop the engine from accepting new keys if it's still running.
    const engine = useEngineStore.getState();
    if (engine.status === 'running') {
      dispatch({ type: 'finish', at: performance.timeOrigin + performance.now() });
    }
  }

  // pickPassage / next are user-initiated passage changes from the variant
  // (e.g. "New file" button). They reset the round so the new passage
  // starts a fresh session. Auto-refill (Race the Clock, Sprint, Drill)
  // advances the index directly inside the intermission timer and does
  // NOT go through these — it preserves session state across passages.
  const resetRound = useCallback(() => {
    setSessionToken((t) => t + 1);
    setSessionDone(false);
    sessionDoneRef.current = false;
    setFinalScore(null);
    setSessionStartedAt(null);
    sessionStartedAtRef.current = null;
    setIntermission(false);
    intermissionRef.current = false;
    setRefillCount(0);
    const init = activeMode.initial(effectiveConfig);
    modeStateRef.current = init;
    setModeState(init);
  }, [activeMode, effectiveConfig]);

  const pickPassage = useCallback(
    (i: number) => {
      resetRound();
      setIndex(i);
    },
    [resetRound],
  );
  const next = useCallback(() => {
    resetRound();
    setIndex((i) => (i + 1) % passages.length);
  }, [resetRound, passages.length]);
  const reset = useCallback(() => {
    resetRound();
    // For a same-passage reset, the engine load effect won't fire on its
    // own (passage.body didn't change), so we dispatch the reload explicitly.
    load(passage.modeId, passage.body);
  }, [resetRound, load, passage.modeId, passage.body]);

  const selectMode = useCallback((modeId: string) => {
    if (!hasMode(modeId)) return;
    setChoice((c) => {
      const nextChoice = { ...c, modeId };
      saveChoice(nextChoice);
      return nextChoice;
    });
  }, []);

  const selectDifficulty = useCallback(
    (difficulty: Difficulty) => {
      setChoice((c) => {
        const nextChoice = { ...c, difficulty };
        saveChoice(nextChoice);
        return nextChoice;
      });
    },
    [],
  );

  return {
    index,
    passage,
    passages,
    pickPassage,
    next,
    reset,
    // Mode plumbing
    activeMode,
    difficulty: choice.difficulty,
    selectMode,
    selectDifficulty,
    modeState,
    effectiveConfig,
    sessionDone,
    intermission,
    finalScore,
    elapsedMs: useEngineStartedAtElapsed(sessionStartedAt),
  };
}

function makeCtx(
  engine: ReturnType<typeof useEngineStore.getState>,
  sessionStartedAt: number | null,
) {
  // elapsedMs reflects the WHOLE round (Race the Clock spans many engine
  // passages). Engine.startedAt resets on each passage refill, so we use
  // the wall-clock sessionStartedAt instead.
  const elapsedMs = sessionStartedAt != null ? Date.now() - sessionStartedAt : 0;
  return {
    engine,
    elapsedMs: Math.max(0, elapsedMs),
    now: performance.timeOrigin + performance.now(),
  };
}

function useEngineStartedAtElapsed(startedAt: number | null): number {
  // Live wall-clock elapsed since the given start time, sampled at 100ms
  // for smooth countdowns. Returns 0 when startedAt is null.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt == null) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [startedAt]);
  if (startedAt == null) return 0;
  return Math.max(0, now - startedAt);
}

function isConsumedKey(key: string): boolean {
  if (key === 'Backspace' || key === 'Tab' || key === 'Enter') return true;
  if (key.length === 1) return true;
  return false;
}

function loadInitialChoice(): ModeChoice {
  const fallbackMode = listModes()[0]?.id ?? 'practice';
  let modeId = fallbackMode;
  let perModeDiff: Record<string, Difficulty> = {};
  try {
    const storedMode = localStorage.getItem(STORAGE_KEY_MODE);
    if (storedMode && hasMode(storedMode)) modeId = storedMode;
    const storedDiffs = localStorage.getItem(STORAGE_KEY_DIFF);
    if (storedDiffs) {
      const parsed = JSON.parse(storedDiffs) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string' && (DIFFICULTY_LEVELS as readonly string[]).includes(v)) {
          perModeDiff[k] = v as Difficulty;
        }
      }
    }
  } catch {
    // localStorage unavailable (SSR / private mode) — fall through to defaults.
  }
  const difficulty: Difficulty = perModeDiff[modeId] ?? 'medium';
  return { modeId, difficulty };
}

function saveChoice(choice: ModeChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY_MODE, choice.modeId);
    const raw = localStorage.getItem(STORAGE_KEY_DIFF);
    let map: Record<string, Difficulty> = {};
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') map[k] = v as Difficulty;
      }
    }
    map[choice.modeId] = choice.difficulty;
    localStorage.setItem(STORAGE_KEY_DIFF, JSON.stringify(map));
  } catch {
    // best-effort; persistence is a nice-to-have not a must.
  }
}
