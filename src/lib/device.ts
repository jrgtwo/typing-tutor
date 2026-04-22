export function isDesktop(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(pointer: fine) and (min-width: 900px)').matches;
}
