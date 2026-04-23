import { useEffect, useRef } from 'react';
import { useEngineStore } from '@/engine/store';

export function useCaretScroll() {
  const caretRef = useRef<HTMLSpanElement | null>(null);
  const cursor = useEngineStore((s) => s.cursor);
  useEffect(() => {
    caretRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [cursor]);
  return caretRef;
}
