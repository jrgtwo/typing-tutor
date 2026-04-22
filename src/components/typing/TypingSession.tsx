import { useEngineStore } from '@/engine/store';
import { CRTFrame } from '@/components/chrome/CRTFrame';
import { TypingSurface } from './TypingSurface';
import { HUD } from './HUD';
import { OnScreenKeyboard } from './OnScreenKeyboard';
import { ResultsPanel } from './ResultsPanel';

interface TypingSessionProps {
  onReset: () => void;
  onNext?: () => void;
}

/**
 * Pure-render typing session. Engine loading and the keydown bridge are
 * handled by usePracticeSession — this component only reads from the store
 * and draws the warm-paper variant.
 */
export function TypingSession({ onReset, onNext }: TypingSessionProps) {
  const status = useEngineStore((s) => s.status);
  const modeId = useEngineStore((s) => s.modeId);

  return (
    <div className="space-y-6">
      <HUD />
      <CRTFrame className="px-8 py-10">
        <TypingSurface />
      </CRTFrame>
      <OnScreenKeyboard />
      {status === 'finished' && <ResultsPanel onReset={onReset} onNext={onNext} />}
      {status !== 'finished' && (
        <p className="text-center font-mono text-xs text-[var(--color-ink-soft)]">
          Just start typing. {modeId === 'code' ? 'Enter auto-skips indentation.' : 'Press Esc to focus the page if needed.'}
        </p>
      )}
    </div>
  );
}
