/**
 * Auto-register every mode by globbing each subfolder's `index.ts(x)` file.
 * Drop a folder in `src/modes/<id>/` exporting a `SessionMode` and calling
 * `registerMode(...)` and it shows up everywhere — picker, admin UI, run
 * loop — with zero edits anywhere outside that folder.
 *
 * The leading `_` underscore prefix is reserved for non-mode subfolders such
 * as `_shared` (utilities) and `_smoke` (the optional verification mode).
 * `_smoke` IS scanned so the smoke test can drop a Hello mode in and see it
 * register without editing this file. Folders starting with `_` other than
 * `_smoke` are not modes; their `index.ts` (if any) won't call registerMode
 * and will simply be a no-op import.
 */
// Eager glob so all matching modules are bundled and their top-level
// `registerMode(...)` calls run before any consumer reads the registry.
const eager = import.meta.glob('./*/index.{ts,tsx}', { eager: true });
void eager;

export { listModes, getMode, hasMode } from './registry';
export {
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABEL,
  type Difficulty,
  type SessionMode,
  type ModeStamp,
  type StampFrame,
  type FinalScore,
} from './types';
