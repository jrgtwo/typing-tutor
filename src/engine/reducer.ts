import type { EngineEvent, EngineState, Mode } from './types';
import { proseMode } from './modes/prose';
import { codeMode } from './modes/code';

const MODES: Record<string, Mode> = {
  prose: proseMode,
  code: codeMode,
};

export function initialState(modeId: 'prose' | 'code', rawTarget: string): EngineState {
  const mode = MODES[modeId];
  return {
    status: 'idle',
    modeId,
    target: mode.normalize(rawTarget),
    cursor: 0,
    typed: '',
    errors: 0,
    charsCorrect: 0,
    charsTyped: 0,
    startedAt: null,
    finishedAt: null,
    lastKeyAt: null,
    lastKey: null,
    keyStats: {},
  };
}

function bumpKey(
  state: EngineState,
  key: string,
  isError: boolean,
  latencyMs: number,
): EngineState['keyStats'] {
  const prev = state.keyStats[key] ?? { presses: 0, errors: 0, totalLatencyMs: 0 };
  return {
    ...state.keyStats,
    [key]: {
      presses: prev.presses + 1,
      errors: prev.errors + (isError ? 1 : 0),
      totalLatencyMs: prev.totalLatencyMs + latencyMs,
    },
  };
}

export function reduce(state: EngineState, event: EngineEvent): EngineState {
  switch (event.type) {
    case 'reset':
      return initialState(state.modeId, state.target);

    case 'start':
      if (state.status !== 'idle') return state;
      return { ...state, status: 'running', startedAt: event.at, lastKeyAt: event.at };

    case 'tick':
      // Tick exists so HUD components can subscribe to a heartbeat for
      // live WPM updates without re-rendering on every keystroke.
      return state;

    case 'finish':
      if (state.status !== 'running') return state;
      return { ...state, status: 'finished', finishedAt: event.at };

    case 'keydown': {
      if (state.status === 'finished') return state;

      // First keystroke transitions idle -> running.
      let s = state;
      if (s.status === 'idle') {
        s = { ...s, status: 'running', startedAt: event.at, lastKeyAt: event.at };
      }

      const mode = MODES[s.modeId];
      const latencyMs = s.lastKeyAt != null ? event.at - s.lastKeyAt : 0;

      // Backspace: walk cursor back one position. Don't decrement charsTyped/errors
      // — those are monotonic to keep accuracy honest.
      if (event.key === 'Backspace') {
        if (s.cursor === 0) return { ...s, lastKeyAt: event.at, lastKey: event.key };
        return {
          ...s,
          cursor: s.cursor - 1,
          typed: s.typed.slice(0, -1),
          lastKeyAt: event.at,
          lastKey: event.key,
        };
      }

      // Only single-character keys (or Enter, Tab) count as input.
      const isCharKey = event.key.length === 1 || event.key === 'Enter' || event.key === 'Tab';
      if (!isCharKey) return { ...s, lastKey: event.key };

      const inputChar =
        event.key === 'Enter' ? '\n' : event.key === 'Tab' ? '\t' : event.key;
      const expected = s.target[s.cursor];
      const correct = mode.shouldAdvance(s, inputChar);

      // Errors don't halt progress — cursor always advances. The wrong char
      // is recorded in `typed`, and the surface paints the position in rust
      // so the user sees where they fumbled. Backspace lets them go fix it.
      let newCursor = s.cursor + 1;
      let newTyped = s.typed + inputChar;
      let newCharsCorrect = s.charsCorrect;
      let newErrors = s.errors;

      if (correct) {
        newCharsCorrect = s.charsCorrect + 1;

        // Code mode: after a correct Enter, auto-skip the next line's indent.
        const indent = mode.getAutoIndent ? mode.getAutoIndent(s) : 0;
        if (indent > 0 && inputChar === '\n') {
          newCursor += indent;
          newTyped += s.target.slice(s.cursor + 1, s.cursor + 1 + indent);
          newCharsCorrect += indent;
        }
      } else {
        newErrors = s.errors + 1;
        // Per-key heatmap counts the error against the EXPECTED key.
      }

      const next: EngineState = {
        ...s,
        cursor: newCursor,
        typed: newTyped,
        charsTyped: s.charsTyped + 1,
        charsCorrect: newCharsCorrect,
        errors: newErrors,
        lastKeyAt: event.at,
        lastKey: event.key,
        keyStats: bumpKey(s, expected ?? inputChar, !correct, latencyMs),
      };

      if (next.cursor >= next.target.length) {
        return { ...next, status: 'finished', finishedAt: event.at };
      }
      return next;
    }

    default:
      return state;
  }
}
