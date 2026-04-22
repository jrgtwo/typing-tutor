import type { Mode } from '../types';

/**
 * Code mode preserves all whitespace exactly. Auto-indent on Enter is
 * handled in the reducer by consulting `getAutoIndent` — typing Enter
 * advances past the newline AND any leading whitespace on the next line.
 */
export const codeMode: Mode = {
  id: 'code',
  normalize(text) {
    return text.replace(/\r\n/g, '\n');
  },
  shouldAdvance(state, key) {
    const expected = state.target[state.cursor];
    return key === expected;
  },
  getAutoIndent(state) {
    if (state.target[state.cursor] !== '\n') return 0;
    let i = state.cursor + 1;
    let count = 0;
    while (i < state.target.length) {
      const ch = state.target[i];
      if (ch === ' ' || ch === '\t') {
        count++;
        i++;
      } else break;
    }
    return count;
  },
};
