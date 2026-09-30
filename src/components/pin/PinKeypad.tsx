import Icon from '@/components/ui/icon';

interface PinKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

export default function PinKeypad({ onDigit, onBackspace, disabled }: PinKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full max-w-[280px] mx-auto">
      {KEYS.map((key, i) => {
        if (key === '') return <div key={i} />;
        if (key === 'backspace') {
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={onBackspace}
              className="h-16 w-16 mx-auto flex items-center justify-center rounded-full text-foreground hover:bg-muted active:scale-95 transition-transform disabled:opacity-40"
            >
              <Icon name="Delete" size={22} />
            </button>
          );
        }
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onDigit(key)}
            className="h-16 w-16 mx-auto flex items-center justify-center rounded-full text-xl font-semibold border border-border hover:bg-muted active:scale-95 transition-transform disabled:opacity-40"
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
