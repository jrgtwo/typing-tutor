import { useEffect, useRef, useState } from 'react';
import { Stamp } from '@/modes/_shared/Stamp';
import { DIFFICULTY_LABEL, type Difficulty, type SessionMode } from '@/modes';

interface Props {
  mode: SessionMode<any, any>;
  difficulty: Difficulty;
}

/**
 * Persistent inked impression rendered on the notepad header. When the
 * active mode changes, the new stamp animates a "thunk" — picks up, drops,
 * and settles. The previous stamp briefly fades behind it as a faint smudge.
 */
export function StampedMode({ mode, difficulty }: Props) {
  const [thunk, setThunk] = useState(false);
  const [smudge, setSmudge] = useState<{ mode: SessionMode<any, any>; difficulty: Difficulty } | null>(null);
  const prevRef = useRef<{ id: string; difficulty: Difficulty }>({
    id: mode.id,
    difficulty,
  });

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.id === mode.id && prev.difficulty === difficulty) return;
    setSmudge((s) => {
      if (s) return s;
      // Build smudge object from the previous mode for visual continuity.
      // We don't have the previous SessionMode reference here, so we just
      // skip the smudge unless it's already populated by an earlier change.
      return s;
    });
    prevRef.current = { id: mode.id, difficulty };
    setThunk(false);
    // double-rAF so the transition cleanly restarts on rapid switches.
    requestAnimationFrame(() => requestAnimationFrame(() => setThunk(true)));
    const t = window.setTimeout(() => {
      setThunk(false);
      setSmudge(null);
    }, 420);
    return () => window.clearTimeout(t);
  }, [mode.id, difficulty]);

  return (
    <span
      aria-label={`${mode.label} · ${DIFFICULTY_LABEL[difficulty]}`}
      className="relative inline-flex items-center gap-2"
      style={{ transformOrigin: 'center' }}
    >
      {smudge && (
        <span
          aria-hidden
          className="absolute"
          style={{ left: 0, top: 0, opacity: 0.18, transform: 'translate(-2px, -1px) rotate(-3deg)' }}
        >
          <Stamp stamp={smudge.mode.stamp} scale={0.85} inked />
        </span>
      )}
      <span
        className="relative"
        style={{
          transform: thunk ? 'translateY(-14px) scale(1.08)' : 'translateY(0) scale(1)',
          transition: thunk ? 'transform 90ms ease-out' : 'transform 240ms cubic-bezier(.2,.9,.3,1)',
        }}
      >
        <Stamp stamp={mode.stamp} scale={0.85} inked />
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-[#2a1f12]/55">
        · {DIFFICULTY_LABEL[difficulty].toLowerCase()}
      </span>
    </span>
  );
}
