import { EndScreenFrame } from '../_shared/EndScreenFrame';
import type { EndScreenProps } from '../types';
import type { PracticeConfig } from './index';

export function PracticeEndScreen({
  score,
  onReset,
  onNext,
}: EndScreenProps<unknown, PracticeConfig>) {
  return (
    <EndScreenFrame
      title="passage complete"
      score={score}
      primaryAction={{ label: 'Next file →', onClick: onNext }}
      secondaryAction={{ label: 'Tear page', onClick: onReset }}
    />
  );
}
