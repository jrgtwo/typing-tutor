import { EndScreenFrame } from '../_shared/EndScreenFrame';
import type { EndScreenProps } from '../types';
import type { SprintConfig, SprintState } from './index';

export function SprintEndScreen({
  score,
  difficulty,
  onReset,
  onNext,
}: EndScreenProps<SprintState, SprintConfig>) {
  return (
    <EndScreenFrame
      title={`${difficulty.targetWords}-word sprint`}
      score={score}
      flair={
        <p className="text-center font-serif text-sm italic opacity-70">
          stopwatch slides off the desk. raccoon yawns.
        </p>
      }
      primaryAction={{ label: 'Run it back →', onClick: onReset }}
      secondaryAction={{ label: 'New file', onClick: onNext }}
    />
  );
}
