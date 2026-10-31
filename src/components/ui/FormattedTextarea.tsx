import { useEffect, useRef } from 'react';
import { useEditor, EditorContent, type JSONContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import HardBreak from '@tiptap/extension-hard-break';
import Bold from '@tiptap/extension-bold';
import { TextStyle, Color, FontSize } from '@tiptap/extension-text-style';
import { Placeholder, UndoRedo } from '@tiptap/extensions';
import Icon from '@/components/ui/icon';
import { parseFormatting, stripFormatting, type FormatNode } from '@/components/ui/FormattedText';

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

const LARGE = '1.25em';
const HEX = /^#[0-9a-fA-F]{6}$/;

const COLORS = [
  { value: '#dc2626', title: 'Красный' },
  { value: '#16a34a', title: 'Зелёный' },
  { value: '#2563eb', title: 'Синий' },
  { value: '#d97706', title: 'Оранжевый' },
];

type Mark = NonNullable<JSONContent['marks']>[number];

function nodesToContent(nodes: FormatNode[], bold: boolean, large: boolean, color: string | null): JSONContent[] {
  const out: JSONContent[] = [];
  for (const n of nodes) {
    if (n.type === 'text') {
      if (!n.text) continue;
      const marks: Mark[] = [];
      if (bold) marks.push({ type: 'bold' });
      if (large || color) {
        marks.push({ type: 'textStyle', attrs: { color: color || null, fontSize: large ? LARGE : null } });
      }
      out.push(marks.length ? { type: 'text', text: n.text, marks } : { type: 'text', text: n.text });
    } else if (n.type === 'bold') {
      out.push(...nodesToContent(n.children, true, large, color));
    } else if (n.type === 'large') {
      out.push(...nodesToContent(n.children, bold, true, color));
    } else if (n.type === 'color') {
      out.push(...nodesToContent(n.children, bold, large, n.color));
    }
  }
  return out;
}

function markupToDoc(value: string): JSONContent {
  return {
    type: 'doc',
    content: (value || '').split('\n').map((line) => {
      const content = nodesToContent(parseFormatting(line), false, false, null);
      return content.length ? { type: 'paragraph', content } : { type: 'paragraph' };
    }),
  };
}

function textNodeToMarkup(node: JSONContent): string {
  if (node.type === 'hardBreak') return '\n';
  let text = node.text || '';
  if (!text) return '';
  const marks = node.marks || [];
  const style = marks.find((m) => m.type === 'textStyle')?.attrs || {};
  if (marks.some((m) => m.type === 'bold')) text = `**${text}**`;
  if (style.fontSize === LARGE) text = `++${text}++`;
  if (typeof style.color === 'string' && HEX.test(style.color)) text = `{${style.color.toLowerCase()}|${text}}`;
  return text;
}

function docToMarkup(doc: JSONContent): string {
  return (doc.content || [])
    .map((p) => (p.content || []).map(textNodeToMarkup).join(''))
    .join('\n');
}

export default function FormattedTextarea({
  id,
  value,
  onChange,
  maxLength,
  rows = 5,
  placeholder,
  disabled,
  showCounter = true,
}: FormattedTextareaProps) {
  const lastValue = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      HardBreak,
      Bold,
      TextStyle,
      Color,
      FontSize,
      UndoRedo,
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: markupToDoc(value),
    editable: !disabled,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class: 'formatted-editor outline-none whitespace-pre-wrap break-words',
        style: `min-height: ${rows * 1.5}rem`,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const next = docToMarkup(ed.getJSON());
      if (stripFormatting(next).length > maxLength) {
        ed.commands.setContent(markupToDoc(lastValue.current), { emitUpdate: false });
        return;
      }
      lastValue.current = next;
      onChangeRef.current(next);
    },
  });

  useEffect(() => {
    if (!editor || value === lastValue.current) return;
    lastValue.current = value;
    editor.commands.setContent(markupToDoc(value), { emitUpdate: false });
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const btn = (active: boolean) =>
    `inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md border text-sm transition-colors disabled:opacity-50 ${
      active ? 'bg-primary text-primary-foreground border-primary' : 'border-input bg-background hover:bg-accent'
    }`;

  const isLarge = editor?.isActive('textStyle', { fontSize: LARGE }) ?? false;
  const currentColor = (editor?.getAttributes('textStyle').color as string | undefined)?.toLowerCase();

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          title="Жирный"
          disabled={disabled || !editor}
          className={btn(editor?.isActive('bold') ?? false)}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleBold().run();
          }}
        >
          <Icon name="Bold" size={15} />
        </button>
        <button
          type="button"
          title="Крупный шрифт"
          disabled={disabled || !editor}
          className={btn(isLarge)}
          onMouseDown={(e) => {
            e.preventDefault();
            if (isLarge) editor?.chain().focus().unsetFontSize().run();
            else editor?.chain().focus().setFontSize(LARGE).run();
          }}
        >
          <Icon name="Heading" size={15} />
        </button>
        <span className="w-px h-5 bg-border mx-0.5" />
        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            title={`Цвет текста: ${c.title}`}
            disabled={disabled || !editor}
            className={btn(currentColor === c.value)}
            onMouseDown={(e) => {
              e.preventDefault();
              if (currentColor === c.value) editor?.chain().focus().unsetColor().run();
              else editor?.chain().focus().setColor(c.value).run();
            }}
          >
            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: c.value }} />
          </button>
        ))}
        <button
          type="button"
          title="Убрать оформление"
          disabled={disabled || !editor}
          className={btn(false)}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().unsetBold().unsetAllMarks().run();
          }}
        >
          <Icon name="RemoveFormatting" fallback="Eraser" size={15} />
        </button>
        <span className="text-xs text-muted-foreground ml-1">Выделите текст и нажмите кнопку</span>
      </div>
      <div
        className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text'
        }`}
        onClick={() => editor?.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>
      {showCounter && (
        <p className="text-xs text-muted-foreground">
          {stripFormatting(value).length}/{maxLength} символов
        </p>
      )}
    </div>
  );
}