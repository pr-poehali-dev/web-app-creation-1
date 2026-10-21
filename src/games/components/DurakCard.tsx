const SUIT_SYMBOLS: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♧' };

interface DurakCardProps {
  card?: string;
  hidden?: boolean;
  size?: 'xs' | 'sm' | 'md';
  selected?: boolean;
  highlight?: boolean;
  dimmed?: boolean;
  trump?: boolean;
  onClick?: () => void;
  className?: string;
}

const SIZES = {
  xs: 'w-7 h-10 text-[10px] rounded',
  sm: 'w-11 h-16 text-sm rounded-md',
  md: 'w-14 h-20 sm:w-16 sm:h-24 text-base sm:text-lg rounded-lg',
};

export default function DurakCard({ card, hidden, size = 'md', selected, highlight, dimmed, onClick, className = '' }: DurakCardProps) {
  const base = `${SIZES[size]} shrink-0 select-none shadow-md transition-all duration-150`;
  if (hidden || !card) {
    return (
      <div
        className={`${base} ${className.includes('absolute') ? '' : 'relative'} bg-gradient-to-br from-indigo-700 to-indigo-950 border border-indigo-300/30 flex items-center justify-center ${className}`}
      >
        <div className="h-[70%] w-[70%] rounded-sm border border-indigo-300/30 bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(165,180,252,0.15)_3px,rgba(165,180,252,0.15)_6px)]" />
      </div>
    );
  }
  const rank = card[0] === 'T' ? '10' : card[0];
  const suit = SUIT_SYMBOLS[card[1]];
  const red = card[1] === 'H' || card[1] === 'D';
  const interactive = !!onClick;
  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      aria-label={`${rank}${suit}`}
      className={`${base} ${className.includes('absolute') ? '' : 'relative'} bg-white border ${
        selected ? 'border-amber-400 ring-2 ring-amber-400 -translate-y-3' : highlight ? 'border-emerald-400 ring-2 ring-emerald-400' : 'border-slate-300'
      } ${red ? 'text-red-600' : 'text-slate-900'} ${interactive ? 'cursor-pointer hover:-translate-y-1' : 'cursor-default'} ${
        dimmed ? 'opacity-50' : ''
      } ${className}`}
    >
      <span className="absolute left-1 top-0.5 flex flex-col items-center font-bold leading-none text-[0.8em]">
        <span>{rank}</span>
        <span className="text-[0.85em]">{suit}</span>
      </span>
      <span className="absolute inset-0 flex items-center justify-center text-[1.5em] leading-none">{suit}</span>
    </button>
  );
}

export const SuitSymbol = ({ suit }: { suit: string }) => (
  <span className={suit === 'H' || suit === 'D' ? 'text-red-400' : 'text-slate-100'}>{SUIT_SYMBOLS[suit]}</span>
);
