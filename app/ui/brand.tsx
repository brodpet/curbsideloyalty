import { CoffeeCupIcon } from './icons';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup${compact ? ' brand-lockup--compact' : ''}`}>
      <span className="brand-mark">
        <CoffeeCupIcon size={compact ? 22 : 26} strokeWidth={1.7} />
      </span>
      <span className="brand-wordmark">
        <span>CURBSIDE</span>
        <span className="brand-cafe">CAFÉ</span>
      </span>
    </div>
  );
}
