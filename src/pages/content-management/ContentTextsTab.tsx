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

const PREVIEW_STYLES: Record<string, { className: string; wrapper?: string; label: string }> = {
  'home.hero.title': {
    className: 'text-3xl md:text-4xl font-bold text-white leading-tight',
    wrapper: 'bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg px-6 py-5',
    label: 'Так выглядит на главной странице',
  },
  'home.hero.subtitle': {
    className: 'text-lg text-slate-200',
    wrapper: 'bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg px-6 py-4',
    label: 'Подзаголовок на главной',
  },
  'home.cta.button': {
    className: 'inline-block px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow',
    wrapper: 'bg-muted/40 rounded-lg px-4 py-4',
    label: 'Кнопка призыва к действию',
  },
  'about.title': {
    className: 'text-2xl font-bold text-foreground',
    wrapper: 'bg-muted/30 rounded-lg px-5 py-4',
    label: 'Заголовок раздела «О нас»',
  },
  'about.description': {
    className: 'text-base text-muted-foreground leading-relaxed',
    wrapper: 'bg-muted/30 rounded-lg px-5 py-4',
    label: 'Краткое описание (показывается в шапке раздела)',
  },
  'about.content': {
    className: 'text-sm text-foreground leading-relaxed whitespace-pre-wrap',
    wrapper: 'bg-muted/30 rounded-lg px-5 py-4 max-h-40 overflow-y-auto',
    label: 'Основной текст раздела «О нас»',
  },
  'footer.description': {
    className: 'text-sm text-slate-400',
    wrapper: 'bg-slate-800 rounded-lg px-5 py-4',
    label: 'Текст в подвале сайта',
  },
  'footer.notice.title': {
    className: 'font-semibold text-base text-amber-900',
    wrapper: 'bg-amber-50 border-2 border-amber-300 rounded-lg px-4 py-3',
    label: 'Заголовок блока «Внимание!» в подвале',
  },
  'footer.notice.text1': {
    className: 'text-sm text-amber-900/80 leading-relaxed',
    wrapper: 'bg-amber-50 border-2 border-amber-300 rounded-lg px-4 py-3',
    label: 'Первый абзац блока «Внимание!»',
  },
  'footer.notice.text2': {
    className: 'text-sm text-amber-900/80 leading-relaxed',
    wrapper: 'bg-amber-50 border-2 border-amber-300 rounded-lg px-4 py-3',
    label: 'Второй абзац блока «Внимание!»',
  },
  'about.intro1': {
    className: 'text-base text-foreground leading-relaxed',
    wrapper: 'bg-muted/30 rounded-lg px-5 py-4',
    label: 'Первый абзац на странице «О нас»',
  },
  'about.intro2': {
    className: 'text-base text-foreground leading-relaxed',
    wrapper: 'bg-muted/30 rounded-lg px-5 py-4',
    label: 'Второй абзац на странице «О нас»',
  },
  'offers.empty.title': {
    className: 'text-xl font-semibold text-foreground',
    wrapper: 'bg-muted/30 rounded-lg px-5 py-4 text-center',
    label: 'Заголовок когда нет предложений',
  },
  'offers.empty.description': {
    className: 'text-sm text-muted-foreground',
    wrapper: 'bg-muted/30 rounded-lg px-5 py-4 text-center',
    label: 'Описание когда нет предложений',
  },
};

function TextPreview({ contentKey, value }: { contentKey: string; value: string }) {
  const style = PREVIEW_STYLES[contentKey];
  if (!style || !value) return null;

  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
        <Icon name="Eye" size={12} />
        {style.label}
      </p>
      <div className={style.wrapper || 'bg-muted/30 rounded-lg px-4 py-3'}>
        <span className={style.className}>{value}</span>
      </div>
    </div>
  );
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
  const CATEGORY_ORDER = ['home', 'about', 'offers', 'footer', 'other'];

  const groupedContent = contentItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const sortedCategories = Object.keys(groupedContent).sort(
    (a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
  );

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
      {sortedCategories.map((category) => {
        const items = groupedContent[category];
        return (
          <div key={category} className="bg-card rounded-xl border overflow-hidden">
            <div className="px-5 py-3 border-b bg-muted/40 flex items-center gap-2">
              <Icon
                name={
                  category === 'home' ? 'Home' :
                  category === 'about' ? 'Info' :
                  category === 'offers' ? 'Package' :
                  category === 'footer' ? 'AlignBottom' : 'FileText'
                }
                size={15}
                className="text-muted-foreground"
              />
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {CATEGORY_LABELS[category] || category}
              </h3>
              <span className="ml-auto text-xs text-muted-foreground">{items.length} текст{items.length > 1 ? 'а' : ''}</span>
            </div>
            <div className="divide-y">
              {items.map((item) => {
                const { label, hint } = getContentLabel(item.key);
                const isEditing = editingKey === item.key;
                const hasPreview = Boolean(PREVIEW_STYLES[item.key]);

                return (
                  <div key={item.key} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{label}</p>
                          {hasPreview && (
                            <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded">
                              с превью
                            </span>
                          )}
                        </div>
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
                      <div className="mt-3 space-y-3">
                        <Textarea
                          value={editValue}
                          onChange={(e) => onChangeValue(e.target.value)}
                          className="min-h-[100px] resize-y"
                          autoFocus
                        />
                        {hasPreview && editValue && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                              <Icon name="Eye" size={12} />
                              Предпросмотр изменений
                            </p>
                            <TextPreview contentKey={item.key} value={editValue} />
                          </div>
                        )}
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
                      <div className="mt-2">
                        {item.value ? (
                          <>
                            <TextPreview contentKey={item.key} value={item.value} />
                            {!hasPreview && (
                              <div className="text-sm text-foreground bg-muted/30 rounded-lg px-3 py-2 whitespace-pre-wrap mt-1">
                                {item.value}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm bg-muted/30 rounded-lg px-3 py-2">
                            <span className="text-muted-foreground italic">Пусто — нажмите «Изменить», чтобы заполнить</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}