export function computeWpm(charsCorrect: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60_000;
  return (charsCorrect / 5) / minutes;
}

export function computeAccuracy(charsCorrect: number, charsTyped: number): number {
  if (charsTyped <= 0) return 1;
  return charsCorrect / charsTyped;
}
