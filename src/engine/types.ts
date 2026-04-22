export type ModeId = 'prose' | 'code';

export interface EngineState {
  status: 'idle' | 'running' | 'finished';
  modeId: ModeId;
  target: string;          // normalized expected text
  cursor: number;          // index of next expected char
  typed: string;           // what the user has actually typed
  errors: number;          // total wrong keystrokes (incl. corrected)
  charsCorrect: number;    // monotonic count of correct chars committed
  charsTyped: number;      // monotonic count of all char keystrokes
  startedAt: number | null; // ms epoch
  finishedAt: number | null;
  lastKeyAt: number | null; // ms epoch of most recent keydown
  lastKey: string | null;
  // Per-key accumulators for this session (flushed to key_stats_session on finish)
  keyStats: Record<string, { presses: number; errors: number; totalLatencyMs: number }>;
}

export type EngineEvent =
  | { type: 'start'; at: number }
  | { type: 'keydown'; key: string; at: number }
  | { type: 'tick'; at: number }
  | { type: 'finish'; at: number }
  | { type: 'reset' };

export interface Mode {
  id: ModeId;
  normalize(text: string): string;
  shouldAdvance(state: EngineState, key: string): boolean;
  /** For code mode: how many leading-whitespace chars to auto-skip after Enter. */
  getAutoIndent?(state: EngineState): number;
}
