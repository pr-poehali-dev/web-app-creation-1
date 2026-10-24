import { useReadableText } from '@/hooks/useReadableText';

const LABELS = ['Обычный шрифт', 'Крупный шрифт', 'Очень крупный шрифт'];

export default function ReadableTextButton({ className = '' }: { className?: string }) {
  const { level, cycle } = useReadableText();
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABELS[level]}. Нажмите, чтобы изменить размер текста`}
      className={`inline-flex h-11 min-w-11 items-center justify-center gap-0.5 rounded-lg border bg-background px-2 font-semibold text-foreground ${className}`}
    >
      <span className="text-xs leading-none">A</span>
      <span className="text-lg leading-none">A</span>
      {level > 0 && <span className="ml-1 text-xs text-primary">{level === 1 ? '×1' : '×2'}</span>}
    </button>
  );
}
