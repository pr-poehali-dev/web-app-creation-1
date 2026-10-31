import { useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import FormattedText, { stripFormatting } from '@/components/ui/FormattedText';

interface FormattedTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showCounter?: boolean;
}

const COLORS = [
  { value: '#dc2626', title: 'Красный' },
  { value: '#16a34a', title: 'Зелёный' },
  { value: '#2563eb', title: 'Синий' },
  { value: '#d97706', title: 'Оранжевый' },
];

const HAS_MARKUP = /\*\*.+?\*\*|\+\+.+?\+\+|\{#[0-9a-fA-F]{6}\|.+?\}/s;

export default function FormattedTextarea({
  id,
  value,
  onChange,
  maxLength,
  rows = 5,
  placeholder,
  required,
  disabled,
  showCounter = true,
}: FormattedTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const handleChange = (next: string) => {
    if (stripFormatting(next).length > maxLength) return;
    onChange(next);
  };

  const wrap = (open: string, close: string) => {
    const el = ref.current;
    if (!el || disabled) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.slice(start, end) || 'текст';
    const next = value.slice(0, start) + open + selected + close + value.slice(end);
    if (stripFormatting(next).length > maxLength) return;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + open.length, start + open.length + selected.length);
    });
  };

  const btn =
    'inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors disabled:opacity-50';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className={btn} title="Жирный" disabled={disabled} onClick={() => wrap('**', '**')}>
          <Icon name="Bold" size={15} />
        </button>
        <button type="button" className={btn} title="Крупный шрифт" disabled={disabled} onClick={() => wrap('++', '++')}>
          <Icon name="Heading" size={15} />
        </button>
        <span className="w-px h-5 bg-border mx-0.5" />
        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={`Цвет текста: ${c.title}`}
            disabled={disabled}
            onClick={() => wrap(`{${c.value}|`, '}')}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent transition-colors disabled:opacity-50"
          >
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: c.value }} />
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-1">Выделите текст и нажмите кнопку</span>
      </div>
      <Textarea
        ref={ref}
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
      />
      {showCounter && (
        <p className="text-xs text-muted-foreground">
          {stripFormatting(value).length}/{maxLength} символов
        </p>
      )}
      {HAS_MARKUP.test(value) && (
        <div className="rounded-md border border-dashed border-input bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground mb-1">Так увидят покупатели:</p>
          <p className="text-sm whitespace-pre-line break-words">
            <FormattedText text={value} />
          </p>
        </div>
      )}
    </div>
  );
}
