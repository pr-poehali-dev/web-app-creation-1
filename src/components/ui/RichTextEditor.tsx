import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  readOnly?: boolean;
}

const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36'];
const COLORS = [
  '#000000', '#374151', '#6B7280', '#9CA3AF',
  '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA',
  '#15803D', '#16A34A', '#22C55E',
  '#B91C1C', '#DC2626', '#EF4444',
  '#D97706', '#F59E0B', '#FBBF24',
  '#7C3AED', '#8B5CF6', '#A78BFA',
];

function ToolbarButton({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded text-sm transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted text-foreground'
      } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, readOnly = false }: RichTextEditorProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const sizeInputRef = useRef<HTMLSelectElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editor) return null;

  const setFontSize = (size: string) => {
    editor.chain().focus().setMark('textStyle', { fontSize: `${size}px` }).run();
  };

  if (readOnly) {
    return (
      <div className="prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 p-2 border-b bg-muted/30">
        {/* History */}
        <div className="flex gap-0.5 pr-2 mr-1 border-r">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Отменить">
            <Icon name="Undo" size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Повторить">
            <Icon name="Redo" size={15} />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex gap-0.5 pr-2 mr-1 border-r">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive('heading', { level: 1 })}
            title="Заголовок 1"
          >
            <span className="text-xs font-bold">H1</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Заголовок 2"
          >
            <span className="text-xs font-bold">H2</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive('heading', { level: 3 })}
            title="Заголовок 3"
          >
            <span className="text-xs font-bold">H3</span>
          </ToolbarButton>
        </div>

        {/* Text style */}
        <div className="flex gap-0.5 pr-2 mr-1 border-r">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Жирный"
          >
            <Icon name="Bold" size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Курсив"
          >
            <Icon name="Italic" size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
            title="Подчёркнутый"
          >
            <Icon name="Underline" size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive('strike')}
            title="Зачёркнутый"
          >
            <Icon name="Strikethrough" size={15} />
          </ToolbarButton>
        </div>

        {/* Font size */}
        <div className="flex items-center pr-2 mr-1 border-r">
          <select
            ref={sizeInputRef}
            onChange={(e) => setFontSize(e.target.value)}
            defaultValue=""
            title="Размер шрифта"
            className="text-xs border rounded px-1 py-1 bg-background h-7 cursor-pointer"
          >
            <option value="" disabled>Размер</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>{s}px</option>
            ))}
          </select>
        </div>

        {/* Color */}
        <div className="flex items-center gap-0.5 pr-2 mr-1 border-r">
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); colorInputRef.current?.click(); }}
              title="Цвет текста"
              className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-muted text-sm"
            >
              <Icon name="Palette" size={15} />
              <span className="text-xs">Цвет</span>
            </button>
            <input
              ref={colorInputRef}
              type="color"
              className="absolute opacity-0 w-0 h-0"
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            />
          </div>
          <div className="flex flex-wrap gap-0.5 max-w-[120px]">
            {COLORS.slice(0, 8).map((color) => (
              <button
                key={color}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(color).run(); }}
                title={color}
                className="w-4 h-4 rounded-sm border border-black/10 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Align */}
        <div className="flex gap-0.5 pr-2 mr-1 border-r">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            active={editor.isActive({ textAlign: 'left' })}
            title="По левому краю"
          >
            <Icon name="AlignLeft" size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            active={editor.isActive({ textAlign: 'center' })}
            title="По центру"
          >
            <Icon name="AlignCenter" size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            active={editor.isActive({ textAlign: 'right' })}
            title="По правому краю"
          >
            <Icon name="AlignRight" size={15} />
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Маркированный список"
          >
            <Icon name="List" size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Нумерованный список"
          >
            <Icon name="ListOrdered" size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title="Цитата"
          >
            <Icon name="Quote" size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Горизонтальная линия"
          >
            <Icon name="Minus" size={15} />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="rich-editor-content min-h-[400px] p-4 focus-within:outline-none text-foreground"
      />
    </div>
  );
}
