import type { ModeId } from '@/engine/types';

export interface SamplePassage {
  id: string;
  modeId: ModeId;
  title: string;
  source?: string;
  body: string;
}

/**
 * Local fallback passages so the typing engine works before remote content
 * is wired. Once `content_items` is queryable, this file can shrink to one
 * placeholder used during dev / when the network is unreachable.
 */
export const SAMPLE_PASSAGES: SamplePassage[] = [
  {
    id: 'sea-fever',
    modeId: 'prose',
    title: 'Sea-Fever',
    source: 'John Masefield',
    body:
      'I must go down to the seas again, to the lonely sea and the sky, and all I ask is a tall ship and a star to steer her by.',
  },
  {
    id: 'workshop',
    modeId: 'prose',
    title: 'Workshop',
    body:
      'A craftsman who blames his tools is one who has not yet found tools that fit his hands. The bench remembers; the wood does not.',
  },
  {
    id: 'fizzbuzz-js',
    modeId: 'code',
    title: 'fizzbuzz.js',
    source: 'classic',
    body:
      'for (let i = 1; i <= 100; i++) {\n  if (i % 15 === 0) console.log("FizzBuzz");\n  else if (i % 3 === 0) console.log("Fizz");\n  else if (i % 5 === 0) console.log("Buzz");\n  else console.log(i);\n}\n',
  },
  {
    id: 'fib-py',
    modeId: 'code',
    title: 'fib.py',
    source: 'classic',
    body:
      'def fib(n: int) -> int:\n    if n < 2:\n        return n\n    a, b = 0, 1\n    for _ in range(n - 1):\n        a, b = b, a + b\n    return b\n',
  },
];
