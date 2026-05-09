import { EndScreenFrame } from '../_shared/EndScreenFrame';
import type { EndScreenProps } from '../types';
import type { DrillConfig, DrillState } from './index';

export function DrillEndScreen({
  score,
  onReset,
  onNext,
}: EndScreenProps<DrillState, DrillConfig>) {
  return (
    <EndScreenFrame
      title="drill complete"
      score={score}
      flair={
        <p className="text-center font-serif text-sm italic opacity-70">
          raccoon stamps the worksheet "FINE."
        </p>
      }
      primaryAction={{ label: 'Drill again →', onClick: onReset }}
      secondaryAction={{ label: 'New file', onClick: onNext }}
    />
  );
}
