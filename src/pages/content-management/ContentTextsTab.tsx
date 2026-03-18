import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { type ContentItem, getContentLabel, CATEGORY_LABELS } from './types';

interface ContentTextsTabProps {
  contentItems: ContentItem[];
  editingKey: string | null;
  editValue: string;
  saving: boolean;
  onStartEdit: (key: string, value: string) => void;
  onCancelEdit: () => void;
  onChangeValue: (value: string) => void;
  onSave: (key: string) => void;
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
}: ContentTextsTabProps) {
  const groupedContent = contentItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  if (contentItems.length === 0) {
    return (
      <div className="bg-card rounded-xl border p-10 text-center text-muted-foreground">
        <Icon name="FileX" size={40} className="mx-auto mb-3 opacity-40" />
        <p>Нет текстов для редактирования</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedContent).map(([category, items]) => (
        <div key={category} className="bg-card rounded-xl border overflow-hidden">
          <div className="px-5 py-3 border-b bg-muted/40">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABELS[category] || category}
            </h3>
          </div>
          <div className="divide-y">
            {items.map((item) => {
              const { label, hint } = getContentLabel(item.key);
              const isEditing = editingKey === item.key;
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
                      >
                        <Icon name="Pencil" size={14} className="mr-1" />
                        Изменить
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-3 space-y-3">
                      <Textarea
                        value={editValue}
                        onChange={(e) => onChangeValue(e.target.value)}
                        className="min-h-[100px] resize-y"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => onSave(item.key)}
                          disabled={saving}
                        >
                          {saving ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={onCancelEdit}
                        >
                          Отмена
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2 whitespace-pre-wrap">
                      {item.value || <span className="text-muted-foreground italic">Пусто</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
