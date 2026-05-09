import { EndScreenFrame } from '../_shared/EndScreenFrame';
import type { EndScreenProps } from '../types';
import type { SurvivalConfig, SurvivalState } from './index';

export function SurvivalEndScreen({
  score,
  state,
  difficulty,
  onReset,
  onNext,
}: EndScreenProps<SurvivalState, SurvivalConfig>) {
  const survived = state.strikesLeft > 0;
  return (
    <EndScreenFrame
      title={survived ? 'survived' : 'desk flipped'}
      score={score}
      flair={
        <p className="text-center font-serif text-sm italic opacity-70">
          {survived
            ? 'somehow, you didn’t crumple a single page.'
            : `${difficulty.strikes} crumpled paper balls. raccoon flipped the desk.`}
        </p>
      }
      primaryAction={{ label: 'Try again', onClick: onReset }}
      secondaryAction={{ label: 'New file', onClick: onNext }}
    />
  );
}
