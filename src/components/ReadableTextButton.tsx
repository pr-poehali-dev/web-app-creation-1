import { useReadableText } from '@/hooks/useReadableText';

const LABELS = ['Обычный шрифт', 'Крупный шрифт', 'Очень крупный шрифт'];

export default function ReadableTextButton({ className = '' }: { className?: string }) {
  const { level, cycle } = useReadableText();
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABELS[level]}. Нажмите, чтобы изменить размер текста`}
      className={`inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-lg border-2 border-primary bg-background px-2.5 font-bold text-primary shadow-sm active:bg-primary/10 ${className}`}
    >
      <span className="leading-none">
        <span className="text-xl">А</span>
        <span className="text-sm">а</span>
      </span>
      {level > 0 && <span className="text-xs">{level === 1 ? '×1' : '×2'}</span>}
    </button>
  );
}
