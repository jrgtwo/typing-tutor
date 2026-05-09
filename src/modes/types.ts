import type { ComponentType } from 'react';
import type { EngineState } from '@/engine/types';

export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard', 'ngplus'] as const;
export type Difficulty = (typeof DIFFICULTY_LEVELS)[number];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  ngplus: 'NG+',
};

export type StampFrame = 'plain' | 'starburst' | 'skull';

export interface ModeStamp {
  /** Word stamped in the impression. Keep it short — fits inside a 96px circle. */
  label: string;
  /** Foreground ink color (CSS). Frame and label both render in this color. */
  inkColor: string;
  /** Decorative frame around the label. Add new variants here as modes are added. */
  frame: StampFrame;
}

/**
 * What every mode lifecycle hook receives to decide what to do with engine
 * events. Selectors are exposed as raw values so modes don't have to know
 * about Zustand or selector hooks.
 */
export interface ModeContext {
  engine: Readonly<EngineState>;
  /** ms since the user's first keystroke for this session, or 0 while idle. */
  elapsedMs: number;
  /** Performance.now() at the moment the lifecycle hook fires. */
  now: number;
}

export interface FinalScore {
  /** A single primary number for end-screen prominence (e.g. WPM, chars typed). */
  primary: number;
  primaryLabel: string;
  primaryFormat?: 'integer' | 'percent' | 'duration-ms';
  /** Up to ~4 secondary metrics. */
  details: { label: string; value: string }[];
}

/**
 * Validate an arbitrary admin-provided JSON object against the mode's
 * difficulty config shape. Returns the cleaned config or an error message.
 * Each mode owns the rules; the admin API uses this to gate writes.
 */
export type DifficultyValidator<TConfig> = (
  raw: unknown,
) => { ok: TConfig } | { error: string };

export interface DifficultyEditorProps<TConfig> {
  value: TConfig;
  onChange: (next: TConfig) => void;
}

export interface HudProps<TState, TConfig> {
  state: TState;
  difficulty: TConfig;
  /** Wall-clock ms since the user's first keystroke this round. Spans
   *  passages for modes that auto-refill, so a countdown HUD doesn't
   *  reset between passages. 0 before the user has typed. */
  elapsedMs: number;
}

export interface EndScreenProps<TState, TConfig> {
  score: FinalScore;
  state: TState;
  difficulty: TConfig;
  onReset: () => void;
  onNext: () => void;
}

export interface SessionMode<TState = unknown, TConfig = unknown> {
  /** Unique stable id; used in URLs, DB rows, localStorage. */
  id: string;
  /** Short human-readable name (e.g. "Race the Clock"). */
  label: string;
  /** One-line description shown in pickers. */
  description: string;

  stamp: ModeStamp;

  /** Per-difficulty default configs; admins can override these per row in `mode_configs`. */
  difficulties: Record<Difficulty, TConfig>;

  /** Validates an arbitrary admin JSON write into a TConfig. */
  validateConfig: DifficultyValidator<TConfig>;

  // ── Lifecycle ──────────────────────────────────────────────────────────
  /** Initial mode-specific state. Pure; safe to call repeatedly. */
  initial(config: TConfig): TState;
  /**
   * Optionally override the passage the engine loads for this mode. Called
   * each time the orchestrator needs a passage (initial load + every refill).
   * Drill uses this to load synthetic challenge text instead of catalog
   * passages. Returning null falls back to the catalog passage.
   */
  getPassageOverride?(
    state: TState,
    config: TConfig,
    refillCount: number,
  ): { id: string; title: string; body: string; modeId: 'prose' | 'code' } | null;
  /** Optional time-driven update; fires on a heartbeat while engine is running. */
  onTick?(state: TState, ctx: ModeContext, dtMs: number, config: TConfig): TState;
  /** Optional keystroke-driven update; fires for every engine keystroke (including backspace). */
  onKeystroke?(
    state: TState,
    ctx: ModeContext,
    evt: { key: string; correct: boolean; isBackspace: boolean },
    config: TConfig,
  ): TState;
  /** Whether the session is over because of a mode-specific rule (e.g. timer hit zero, last strike used). */
  isComplete(state: TState, ctx: ModeContext, config: TConfig): boolean;
  /**
   * When the engine finishes a passage, should the orchestrator load the next
   * passage and continue (Race the Clock) instead of ending the session
   * (Practice / Survival). Default: end.
   */
  shouldRefillPassage?(state: TState, ctx: ModeContext, config: TConfig): boolean;
  /**
   * Called immediately before the orchestrator resets the engine for a refill.
   * The mode can roll engine stats into its internal state (Race the Clock
   * banks completed-passage chars). The returned state is used going forward.
   */
  onPassageRefill?(state: TState, ctx: ModeContext, config: TConfig): TState;
  /**
   * Whether backspace input should be ignored at the engine level. Returns a
   * fresh value on every keydown so modes can disable it dynamically.
   * Default: false.
   */
  blockBackspace?(state: TState, ctx: ModeContext, config: TConfig): boolean;
  /** Final score for the end screen. Called once when the session completes. */
  finalScore(state: TState, ctx: ModeContext, config: TConfig): FinalScore;

  // ── UI (each mode brings its own) ─────────────────────────────────────
  HudComponent: ComponentType<HudProps<TState, TConfig>>;
  EndScreenComponent?: ComponentType<EndScreenProps<TState, TConfig>>;
  /** Optional typed editor for the admin console. If absent, generic JSON editor is used. */
  DifficultyConfigEditor?: ComponentType<DifficultyEditorProps<TConfig>>;
}
