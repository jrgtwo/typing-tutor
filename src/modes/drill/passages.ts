/**
 * Drill passages: short synthetic strings that hammer specific keyboard
 * regions. Curated by hand rather than randomly generated so the drills
 * read as coherent practice text rather than gibberish.
 *
 * Difficulty bands:
 *  - easy   = home-row + common digraphs
 *  - medium = full alphabet + light punctuation
 *  - hard   = numbers row + symbols
 *  - ngplus = code-style: brackets, semicolons, mixed case
 */

export interface DrillPassage {
  id: string;
  body: string;
}

export const DRILL_PASSAGES: Record<string, DrillPassage[]> = {
  easy: [
    { id: 'home-row-1',  body: 'asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl;' },
    { id: 'home-row-2',  body: 'a sad lass had a flask; a glass jar fell.' },
    { id: 'th-words',    body: 'the third thought thudded through their thatched roof.' },
    { id: 'er-words',    body: 'her father remembered every letter the writer wrote.' },
    { id: 'ing-words',   body: 'singing, ringing, swinging, bringing, clinging, stinging.' },
  ],
  medium: [
    { id: 'pangram-1',   body: 'the quick brown fox jumps over the lazy dog.' },
    { id: 'pangram-2',   body: 'pack my box with five dozen liquor jugs.' },
    { id: 'pangram-3',   body: 'sphinx of black quartz, judge my vow.' },
    { id: 'pangram-4',   body: 'how vexingly quick daft zebras jump!' },
    { id: 'mixed-words', body: 'crisp jackdaws love my big sphinx of quartz.' },
  ],
  hard: [
    { id: 'numbers-1',   body: '1234567890 9876543210 1029384756 5647382910' },
    { id: 'numbers-2',   body: 'in 1492, columbus sailed; in 1969, we landed.' },
    { id: 'symbols-1',   body: 'cost: $42.99 (was $99.95) — save 57%! email: a@b.co' },
    { id: 'symbols-2',   body: '"yes," she said, "5 < 10, but 10 > 5; got it?"' },
    { id: 'addresses',   body: '742 evergreen tr. springfield, OR 97477 (USA)' },
  ],
  ngplus: [
    { id: 'code-1',      body: 'const x = (a, b) => a + b; // arrow fn' },
    { id: 'code-2',      body: 'if (n >= 0) { return [n, ...arr.slice(1)]; }' },
    { id: 'code-3',      body: 'await fetch(`/api/v1/users?id=${id}&fmt=json`);' },
    { id: 'code-4',      body: 'type Point = { x: number; y: number }; // 2D' },
    { id: 'code-5',      body: 'for (let i = 0; i < arr.length; i++) console.log(arr[i]);' },
  ],
};
