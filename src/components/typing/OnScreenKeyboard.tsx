import { memo, useEffect, useRef } from 'react';
import { useEngineStore } from '@/engine/store';
import type { EngineState } from '@/engine/types';
import { cn } from '@/lib/utils';

/**
 * Compact ANSI-style keyboard, three layers stacked:
 *  - heatmap base: each pressed key gets a tint whose INTENSITY scales with
 *    how often you've pressed it (more use → more visible) and whose HUE
 *    lerps from phosphor green (clean) to rust (lots of misses).
 *  - expected-key ring: phosphor green outline on the next key the engine wants
 *  - active flash: amber tint on the most recent key (replaced on next key)
 *
 * The active layer overrides the expected layer overrides the heatmap, so
 * you can read all three at once without them fighting.
 */

type Cell = { id: string; label: string; flex?: number; class?: string };

const ROW_NUM: Cell[] = [
  { id: '`', label: '`' },
  { id: '1', label: '1' },
  { id: '2', label: '2' },
  { id: '3', label: '3' },
  { id: '4', label: '4' },
  { id: '5', label: '5' },
  { id: '6', label: '6' },
  { id: '7', label: '7' },
  { id: '8', label: '8' },
  { id: '9', label: '9' },
  { id: '0', label: '0' },
  { id: '-', label: '-' },
  { id: '=', label: '=' },
  { id: 'Backspace', label: '⌫', flex: 2 },
];

const ROW_TOP: Cell[] = [
  { id: 'Tab', label: 'tab', flex: 1.5 },
  ...['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((c) => ({ id: c, label: c })),
  { id: '[', label: '[' },
  { id: ']', label: ']' },
  { id: '\\', label: '\\', flex: 1.5 },
];

const ROW_HOME: Cell[] = [
  { id: 'CapsLock', label: 'caps', flex: 1.75 },
  ...['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map((c) => ({ id: c, label: c })),
  { id: ';', label: ';' },
  { id: "'", label: "'" },
  { id: 'Enter', label: '⏎', flex: 2.25 },
];

const ROW_BOT: Cell[] = [
  { id: 'Shift', label: 'shift', flex: 2.25 },
  ...['z', 'x', 'c', 'v', 'b', 'n', 'm'].map((c) => ({ id: c, label: c })),
  { id: ',', label: ',' },
  { id: '.', label: '.' },
  { id: '/', label: '/' },
  { id: 'Shift', label: 'shift', flex: 2.75 },
];

const ROW_SPACE: Cell[] = [
  { id: 'Control', label: 'ctrl', flex: 1.5 },
  { id: 'Alt', label: 'alt', flex: 1.5 },
  { id: ' ', label: '', flex: 8 },
  { id: 'Alt', label: 'alt', flex: 1.5 },
  { id: 'Control', label: 'ctrl', flex: 1.5 },
];

function normalizeKey(key: string | null): string | null {
  if (key == null) return null;
  if (key.length === 1) return key.toLowerCase();
  return key;
}

function expectedKeyFor(target: string, cursor: number): string | null {
  const ch = target[cursor];
  if (ch == null) return null;
  if (ch === '\n') return 'Enter';
  if (ch === '\t') return 'Tab';
  return ch.toLowerCase();
}

function OnScreenKeyboardImpl() {
  const lastKey = useEngineStore((s) => s.lastKey);
  const lastKeyAt = useEngineStore((s) => s.lastKeyAt);
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const status = useEngineStore((s) => s.status);
  const keyStats = useEngineStore((s) => s.keyStats);

  const active = normalizeKey(lastKey);
  const expected = status === 'finished' ? null : expectedKeyFor(target, cursor);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-1.5 select-none">
      <KeyRow row={ROW_NUM} active={active} expected={expected} stats={keyStats} lastKeyAt={lastKeyAt} />
      <KeyRow row={ROW_TOP} active={active} expected={expected} stats={keyStats} lastKeyAt={lastKeyAt} />
      <KeyRow row={ROW_HOME} active={active} expected={expected} stats={keyStats} lastKeyAt={lastKeyAt} />
      <KeyRow row={ROW_BOT} active={active} expected={expected} stats={keyStats} lastKeyAt={lastKeyAt} />
      <KeyRow row={ROW_SPACE} active={active} expected={expected} stats={keyStats} lastKeyAt={lastKeyAt} />
    </div>
  );
}

interface KeyRowProps {
  row: Cell[];
  active: string | null;
  expected: string | null;
  stats: EngineState['keyStats'];
  lastKeyAt: number | null;
}

function KeyRow({ row, active, expected, stats, lastKeyAt }: KeyRowProps) {
  return (
    <div className="flex gap-1.5">
      {row.map((cell, i) => (
        <Key
          key={`${cell.id}-${i}`}
          cell={cell}
          active={active}
          expected={expected}
          stats={stats}
          lastKeyAt={lastKeyAt}
        />
      ))}
    </div>
  );
}

interface KeyProps {
  cell: Cell;
  active: string | null;
  expected: string | null;
  stats: EngineState['keyStats'];
  lastKeyAt: number | null;
}

function spawnDebris(el: HTMLDivElement) {
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  // warm palette: amber, paper-deep, ink-soft
  const colors = ['#c87533', '#ead8b8', '#5a4a36'];
  const count = 5 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const angle = Math.random() * Math.PI * 2;
    const dist = 14 + Math.random() * 22;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 6; // slight upward bias
    const size = 1.5 + Math.random() * 2.5;
    const rotate = Math.random() * 120 - 60;
    const color = colors[Math.floor(Math.random() * colors.length)];

    p.style.cssText = `
      position:fixed;pointer-events:none;z-index:9999;
      width:${size}px;height:${size}px;
      background:${color};border-radius:1px;
      left:${cx}px;top:${cy}px;
      transform:translate(-50%,-50%);
      opacity:1;
      transition:transform 280ms ease-out,opacity 260ms ease-out;
    `;
    document.body.appendChild(p);

    requestAnimationFrame(() => {
      p.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${rotate}deg) scale(0.2)`;
      p.style.opacity = '0';
    });

    setTimeout(() => p.remove(), 320);
  }
}

function Key({ cell, active, expected, stats, lastKeyAt }: KeyProps) {
  const isActive = active != null && active === cell.id;
  const isExpected = expected != null && expected === cell.id;
  const heat = aggregateHeat(cell.id, stats);
  const heatStyle = !isActive && heat.bg ? { backgroundColor: heat.bg } : undefined;

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;
    const el = ref.current;
    el.classList.remove('key-smash');
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add('key-smash');
    spawnDebris(el);
  }, [isActive, lastKeyAt]);

  return (
    <div
      ref={ref}
      style={{ flex: cell.flex ?? 1, ...heatStyle }}
      className={cn(
        'flex h-9 items-center justify-center rounded border font-mono text-[11px] uppercase',
        'transition-colors duration-75',
        // base
        'border-[var(--color-paper-deep)] bg-[var(--color-paper)] text-[var(--color-ink-soft)]',
        // expected: phosphor green ring
        isExpected &&
          'border-[var(--color-phosphor)] text-[var(--color-phosphor-dim)] shadow-[0_0_0_1px_var(--color-phosphor)_inset]',
        // active: amber tint, overrides expected + heatmap for momentary feedback
        isActive &&
          'border-[var(--color-amber)] bg-[var(--color-amber)]/30 text-[var(--color-ink)] shadow-[0_2px_0_var(--color-paper-deep)]',
      )}
      title={
        heat.presses > 0
          ? `${heat.presses} press${heat.presses === 1 ? '' : 'es'}, ${heat.errors} error${heat.errors === 1 ? '' : 's'}`
          : undefined
      }
      aria-hidden
    >
      {cell.label}
    </div>
  );
}

/**
 * Per-key heat from the engine's session stats. We map UI cell ids to the
 * underlying expected-char keys the reducer accumulates against:
 *  - Enter ↔ '\n', Tab ↔ '\t'
 *  - letter cells aggregate lower + upper case (same physical key)
 *  - modifiers (Shift, Ctrl, Alt, Caps, Backspace) have no entry — they
 *    aren't typeable target chars, so they always render neutral
 *
 * Returns a precomputed background color so the renderer is a one-liner.
 * The color encodes BOTH usage (intensity, via opacity) AND error rate
 * (hue, lerping phosphor green → rust).
 */
const HEAT_SATURATION_PRESSES = 15;       // presses needed to reach full intensity
const HEAT_MAX_OPACITY = 0.45;            // stays below active-amber so flash wins

function aggregateHeat(cellId: string, stats: EngineState['keyStats']) {
  const candidates: string[] = [];
  if (cellId === 'Enter') candidates.push('\n');
  else if (cellId === 'Tab') candidates.push('\t');
  else if (
    cellId === 'Backspace' ||
    cellId === 'Shift' ||
    cellId === 'Control' ||
    cellId === 'Alt' ||
    cellId === 'CapsLock'
  ) {
    // modifier keys aren't tracked
  } else if (cellId.length === 1) {
    candidates.push(cellId);
    const upper = cellId.toUpperCase();
    if (upper !== cellId) candidates.push(upper);
  }

  let presses = 0;
  let errors = 0;
  for (const k of candidates) {
    const s = stats[k];
    if (!s) continue;
    presses += s.presses;
    errors += s.errors;
  }

  if (presses === 0) {
    return { presses: 0, errors: 0, bg: null as string | null };
  }

  // Hue: lerp phosphor (127,176,105) → rust (162,59,39) by error rate.
  const errorRate = errors / presses;
  const r = Math.round(127 + (162 - 127) * errorRate);
  const g = Math.round(176 + (59 - 176) * errorRate);
  const b = Math.round(105 + (39 - 105) * errorRate);

  // Intensity: scales by usage, saturating at HEAT_SATURATION_PRESSES so
  // a single press doesn't blast the full color. Rare keys stay subtle.
  const intensity = Math.min(1, presses / HEAT_SATURATION_PRESSES);
  const opacity = +(intensity * HEAT_MAX_OPACITY).toFixed(3);

  return {
    presses,
    errors,
    bg: `rgba(${r}, ${g}, ${b}, ${opacity})`,
  };
}

export const OnScreenKeyboard = memo(OnScreenKeyboardImpl);
