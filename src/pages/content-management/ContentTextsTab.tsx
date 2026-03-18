import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { type ContentItem, getContentLabel } from './types';

const BOOLEAN_KEYS = new Set(['footer.notice.visible']);
const RICH_TEXT_KEYS = new Set(['about.page']);

const ALLOWED_KEYS = new Set([
  'about.page',
  'footer.notice.title',
  'footer.notice.text1',
  'footer.notice.text2',
  'footer.notice.visible',
]);

interface ContentTextsTabProps {
  contentItems: ContentItem[];
  editingKey: string | null;
  editValue: string;
  saving: boolean;
  onStartEdit: (key: string, value: string) => void;
  onCancelEdit: () => void;
  onChangeValue: (value: string) => void;
  onSave: (key: string) => void;
  onSaveValue: (key: string, value: string) => void;
}

export default function ContentTextsTab({
  contentItems,
  editingKey,
  editValue,
  saving,
  onStartEdit,
  onCancelEdit,
  onChangeValue,
  onSave,
  onSaveValue,
}: ContentTextsTabProps) {
  const filtered = contentItems.filter(item => ALLOWED_KEYS.has(item.key));

  const aboutItems = filtered.filter(item => item.key === 'about.page');
  const footerItems = filtered.filter(item => item.key.startsWith('footer.notice'));

  if (filtered.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-10 text-center text-muted-foreground">
        <Icon name="FileX" size={40} className="mx-auto mb-3 opacity-40" />
        <p>Нет текстов для редактирования</p>
      </div>
    );
  }

  const renderItem = (item: ContentItem) => {
    const { label, hint } = getContentLabel(item.key);
    const isEditing = editingKey === item.key;
    const isBoolean = BOOLEAN_KEYS.has(item.key);
    const isRichText = RICH_TEXT_KEYS.has(item.key);
    const boolValue = item.value !== 'false';

    if (isRichText) {
      return (
        <div key={item.key} className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-medium text-sm">{label}</p>
              {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
            </div>
            {!isEditing && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onStartEdit(item.key, item.value)}
                className="shrink-0"
              >
                <Icon name="Pencil" size={14} className="mr-1" />
                Редактировать
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <RichTextEditor
                value={editValue}
                onChange={onChangeValue}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onSave(item.key)} disabled={saving}>
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button size="sm" variant="outline" onClick={onCancelEdit}>
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="about-rich-content border rounded-lg p-4 bg-muted/20 text-sm text-foreground max-h-60 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: item.value || '<p class="text-muted-foreground italic">Нет содержимого</p>' }}
            />
          )}
        </div>
      );
    }

    if (isBoolean) {
      return (
        <div key={item.key} className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">{label}</p>
            {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
          </div>
          <button
            onClick={() => onSaveValue(item.key, boolValue ? 'false' : 'true')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              boolValue ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                boolValue ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      );
    }

    return (
      <div key={item.key} className="p-5">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <p className="font-medium text-sm">{label}</p>
            {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartEdit(item.key, item.value)}
              className="shrink-0"
            >
              <Icon name="Pencil" size={14} className="mr-1" />
              Изменить
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editValue}
              onChange={(e) => onChangeValue(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onSave(item.key)} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button size="sm" variant="outline" onClick={onCancelEdit}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-2.5 leading-relaxed">
            {item.value || <span className="italic opacity-60">Не задано</span>}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {aboutItems.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/40 flex items-center gap-2">
            <Icon name="Info" size={15} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Страница «О нас»
            </h3>
          </div>
          <div className="divide-y">
            {aboutItems.map(renderItem)}
          </div>
        </div>
      )}

      {footerItems.length > 0 && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/40 flex items-center gap-2">
            <Icon name="AlertTriangle" size={15} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Блок «Внимание» (подвал и страница «О нас»)
            </h3>
          </div>
          <div className="divide-y">
            {footerItems.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
}
