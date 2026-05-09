import { EndScreenFrame } from '../_shared/EndScreenFrame';
import type { EndScreenProps } from '../types';
import type { GhostRaceConfig, GhostRaceState } from './index';

export function GhostRaceEndScreen({
  score,
  state,
  onReset,
  onNext,
}: EndScreenProps<GhostRaceState, GhostRaceConfig>) {
  const isNewBest = score.primaryLabel.includes('new best');
  const flair = isNewBest
    ? 'translucent raccoon shrugs. fine.'
    : state.record
      ? 'translucent raccoon types in the air. unbothered.'
      : 'no ghost yet — that record is yours.';
  return (
    <EndScreenFrame
      title={isNewBest ? 'new personal best' : state.record ? 'race complete' : 'pace set'}
      score={score}
      flair={
        <p className="text-center font-serif text-sm italic opacity-70">{flair}</p>
      }
      primaryAction={{ label: 'Race again →', onClick: onReset }}
      secondaryAction={{ label: 'New file', onClick: onNext }}
    />
  );
}
