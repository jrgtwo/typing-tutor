import { apiFetch } from '@/lib/api';
import { computeAccuracy, computeWpm } from './metrics';
import type { EngineState } from './types';

interface PersistOptions {
  contentItemId?: string | null;
}

/**
 * Persist a finished session to the backend. Caller is responsible for
 * checking auth state — anonymous users should not call this. Failures
 * are logged but never thrown; a network hiccup must not break the UI.
 */
export async function persistFinishedSession(
  state: EngineState,
  { contentItemId = null }: PersistOptions = {},
): Promise<void> {
  if (state.status !== 'finished') return;
  if (state.startedAt == null || state.finishedAt == null) return;

  const startedAtIso = new Date(state.startedAt).toISOString();
  const finishedAtIso = new Date(state.finishedAt).toISOString();
  const durationMs = Math.round(state.finishedAt - state.startedAt);
  const wpm = computeWpm(state.charsCorrect, durationMs);
  const accuracy = computeAccuracy(state.charsCorrect, state.charsTyped);

  try {
    const createRes = await apiFetch('/api/sessions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: state.modeId,
        startedAt: startedAtIso,
        contentItemId,
      }),
    });
    if (!createRes.ok) {
      console.warn('[persist] create session failed', createRes.status);
      return;
    }
    const { id } = (await createRes.json()) as { id: string };

    const stats = Object.entries(state.keyStats).map(([key, s]) => ({
      key,
      presses: s.presses,
      errors: s.errors,
      totalLatencyMs: Math.round(s.totalLatencyMs),
    }));

    const [patchRes, statsRes] = await Promise.all([
      apiFetch(`/api/sessions/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          finishedAt: finishedAtIso,
          durationMs,
          charsTyped: state.charsTyped,
          charsCorrect: state.charsCorrect,
          errors: state.errors,
          wpm: Number.isFinite(wpm) ? wpm : 0,
          accuracy: Number.isFinite(accuracy) ? accuracy : 0,
        }),
      }),
      stats.length > 0
        ? apiFetch('/api/key-stats', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId: id, stats }),
          })
        : Promise.resolve(null),
    ]);

    if (!patchRes.ok) {
      console.warn('[persist] finalize session failed', patchRes.status);
    }
    if (statsRes && !statsRes.ok) {
      console.warn('[persist] key-stats failed', statsRes.status);
    }
  } catch (err) {
    console.warn('[persist] error persisting session', err);
  }
}
