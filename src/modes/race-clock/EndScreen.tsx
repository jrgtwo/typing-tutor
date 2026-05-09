import { EndScreenFrame } from '../_shared/EndScreenFrame';
import type { EndScreenProps } from '../types';
import type { RaceClockConfig } from './index';

export function RaceClockEndScreen({
  score,
  difficulty,
  onReset,
  onNext,
}: EndScreenProps<unknown, RaceClockConfig>) {
  return (
    <EndScreenFrame
      title={`${Math.round(difficulty.durationMs / 1000)}s · race complete`}
      score={score}
      flair={
        <p className="text-center font-serif text-sm italic opacity-70">
          time's up. the raccoon's chewed pencil rolls off the desk.
        </p>
      }
      primaryAction={{ label: 'Race again →', onClick: onReset }}
      secondaryAction={{ label: 'New file', onClick: onNext }}
    />
  );
}
