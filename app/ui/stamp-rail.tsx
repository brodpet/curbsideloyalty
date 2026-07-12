import { CoffeeCupIcon } from './icons';

type StampRailProps = {
  currentStamps: number;
  threshold: number;
  compact?: boolean;
};

export function StampRail({ currentStamps, threshold, compact = false }: StampRailProps) {
  return (
    <div
      aria-label={`${currentStamps} of ${threshold} stamps collected`}
      className={`stamp-rail${compact ? ' stamp-rail--compact' : ''}`}
      role="img"
    >
      {Array.from({ length: threshold }, (_, index) => {
        const filled = index < currentStamps;
        return (
          <span className={`stamp-slot${filled ? ' stamp-slot--filled' : ''}`} key={index}>
            {filled ? <CoffeeCupIcon size={compact ? 13 : 17} strokeWidth={1.7} /> : <span>{index + 1}</span>}
          </span>
        );
      })}
    </div>
  );
}
