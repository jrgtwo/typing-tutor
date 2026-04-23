import { memo, useEffect, useMemo, useRef } from 'react';
import { useEngineStore } from '@/engine/store';
import { cn } from '@/lib/utils';

/**
 * Renders the target text with per-character styling. The caret is the
 * currently-pending character with a blinking underline; correct chars are
 * full-ink, untyped chars are muted, mistyped chars get rust + a strikeout
 * (for chars typed wrong but already moved past — we don't actually allow
 * skipping past wrong chars in v1, but on backspace the visual updates).
 *
 * For code mode, whitespace is visualized so users can see what they're
 * typing — middle-dot for spaces, ↵ for newlines, → for tabs.
 */
function TypingSurfaceImpl() {
  const target = useEngineStore((s) => s.target);
  const cursor = useEngineStore((s) => s.cursor);
  const typed = useEngineStore((s) => s.typed);
  const modeId = useEngineStore((s) => s.modeId);
  const status = useEngineStore((s) => s.status);

  const chars = useMemo(() => Array.from(target), [target]);
  const caretRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    caretRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [cursor]);

  return (
    <div
      className={cn(
        'whitespace-pre-wrap break-words font-mono text-2xl leading-relaxed',
        'select-none tracking-wide',
        'text-[var(--color-ink-soft)]/70',
      )}
      aria-label="Typing target"
    >
      {chars.map((ch, i) => {
        const isPast = i < cursor;
        const isCurrent = i === cursor && status !== 'finished';
        const wasCorrect = isPast && typed[i] === ch;
        return (
          <CharGlyph
            key={i}
            ch={ch}
            isPast={isPast}
            isCurrent={isCurrent}
            wasCorrect={wasCorrect}
            visualizeWhitespace={modeId === 'code'}
            caretRef={isCurrent ? caretRef : undefined}
          />
        );
      })}
      {/* Tail caret when finished — sits at end of text */}
      {status === 'finished' && <span className="ml-0.5 text-[var(--color-amber)]">■</span>}
    </div>
  );
}

interface CharGlyphProps {
  ch: string;
  isPast: boolean;
  isCurrent: boolean;
  wasCorrect: boolean;
  visualizeWhitespace: boolean;
  caretRef?: React.RefObject<HTMLSpanElement | null>;
}

function CharGlyph({ ch, isPast, isCurrent, wasCorrect, visualizeWhitespace, caretRef }: CharGlyphProps) {
  let display: string = ch;
  let extraClass = '';

  if (ch === '\n') {
    return (
      <>
        {visualizeWhitespace && (
          <span
            ref={caretRef}
            className={cn(
              'opacity-30',
              isCurrent && 'text-[var(--color-amber)] opacity-80 caret-blink',
            )}
          >
            ↵
          </span>
        )}
        {'\n'}
      </>
    );
  }

  if (ch === '\t') {
    display = visualizeWhitespace ? '→\t' : '\t';
  } else if (ch === ' ' && visualizeWhitespace && !isPast) {
    extraClass = 'opacity-40';
  }

  let colorClass = 'text-[var(--color-ink-soft)]/60'; // pending
  if (isCurrent) {
    colorClass =
      'text-[var(--color-ink)] bg-[var(--color-amber)]/30 caret-blink rounded-[2px]';
  } else if (isPast && wasCorrect) {
    colorClass = 'text-[var(--color-ink)]';
  } else if (isPast && !wasCorrect) {
    // Mistyped — cursor moved past it. Stand out without shifting layout.
    colorClass = 'text-[var(--color-rust)] bg-[var(--color-rust)]/15 rounded-[2px]';
  }

  return <span ref={caretRef} className={cn(colorClass, extraClass)}>{display}</span>;
}

export const TypingSurface = memo(TypingSurfaceImpl);
