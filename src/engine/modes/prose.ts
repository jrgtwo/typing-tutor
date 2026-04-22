import type { Mode } from '../types';

const SMART_MAP: Record<string, string> = {
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  '…': '...',
};

export const proseMode: Mode = {
  id: 'prose',
  normalize(text) {
    return text
      .replace(/[‘’“”–—…]/g, (c) => SMART_MAP[c] ?? c)
      .replace(/[ \t]+/g, ' ')
      .replace(/\r\n/g, '\n');
  },
  // Standard advance: any single character key matches the next expected char.
  shouldAdvance(state, key) {
    const expected = state.target[state.cursor];
    return key === expected;
  },
};
