import { cn } from '@/lib/utils';
import type { DashboardKeyStat } from '@/lib/queries';

/**
 * Static keyboard heatmap driven by aggregated stats (lifetime). Mirrors
 * the live OnScreenKeyboard layout but without engine subscriptions or
 * key-press animations. Color encodes both axes:
 *  - intensity by total presses (saturates at HEAT_SATURATION_PRESSES)
 *  - hue lerps phosphor green → rust by error rate
 */

type Cell = { id: string; label: string; flex?: number };

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

const HEAT_SATURATION_PRESSES = 250; // lifetime stats accumulate, so saturate higher
const HEAT_MAX_OPACITY = 0.55;

interface AggStat {
  presses: number;
  errors: number;
}

function indexStats(stats: DashboardKeyStat[]): Map<string, AggStat> {
  const map = new Map<string, AggStat>();
  for (const s of stats) {
    const presses = Number(s.presses) || 0;
    const errors = Number(s.errors) || 0;
    map.set(s.key, { presses, errors });
  }
  return map;
}

function aggregateForCell(cellId: string, idx: Map<string, AggStat>): AggStat {
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
    // not tracked
  } else if (cellId.length === 1) {
    candidates.push(cellId);
    const upper = cellId.toUpperCase();
    if (upper !== cellId) candidates.push(upper);
  }

  let presses = 0;
  let errors = 0;
  for (const k of candidates) {
    const s = idx.get(k);
    if (!s) continue;
    presses += s.presses;
    errors += s.errors;
  }
  return { presses, errors };
}

function colorFor({ presses, errors }: AggStat): string | null {
  if (presses === 0) return null;
  const errorRate = errors / presses;
  const r = Math.round(127 + (162 - 127) * errorRate);
  const g = Math.round(176 + (59 - 176) * errorRate);
  const b = Math.round(105 + (39 - 105) * errorRate);
  const intensity = Math.min(1, presses / HEAT_SATURATION_PRESSES);
  const opacity = +(intensity * HEAT_MAX_OPACITY).toFixed(3);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function KeyHeatmap({ stats, className }: { stats: DashboardKeyStat[]; className?: string }) {
  const idx = indexStats(stats);
  const rows = [ROW_NUM, ROW_TOP, ROW_HOME, ROW_BOT, ROW_SPACE];

  return (
    <div className={cn('mx-auto flex max-w-3xl flex-col gap-1.5 select-none', className)}>
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map((cell, i) => {
            const agg = aggregateForCell(cell.id, idx);
            const bg = colorFor(agg);
            const errorRate = agg.presses > 0 ? agg.errors / agg.presses : 0;
            return (
              <div
                key={`${cell.id}-${i}`}
                style={{
                  flex: cell.flex ?? 1,
                  ...(bg ? { backgroundColor: bg } : null),
                }}
                className="flex h-9 items-center justify-center rounded border border-[var(--color-paper-deep)] bg-[var(--color-paper)] font-mono text-[11px] uppercase text-[var(--color-ink-soft)]"
                title={
                  agg.presses > 0
                    ? `${agg.presses.toLocaleString()} presses · ${agg.errors.toLocaleString()} errors (${(errorRate * 100).toFixed(1)}%)`
                    : undefined
                }
                aria-hidden
              >
                {cell.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
