import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { type BannerItem, type BannerFormState, PAGE_OPTIONS } from './types';

interface BannerFormProps {
  bannerForm: BannerFormState;
  editingBanner: BannerItem | null;
  saving: boolean;
  onChange: (form: BannerFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function BannerForm({
  bannerForm,
  editingBanner,
  saving,
  onChange,
  onSave,
  onCancel,
}: BannerFormProps) {
  const togglePage = (page: string) => {
    const pages = bannerForm.showOnPages.includes(page)
      ? bannerForm.showOnPages.filter(p => p !== page)
      : [...bannerForm.showOnPages, page];
    onChange({ ...bannerForm, showOnPages: pages });
  };

  return (
    <div className="bg-card rounded-xl border p-6">
      <h3 className="text-lg font-bold mb-5">
        {editingBanner ? 'Редактировать баннер' : 'Новый баннер'}
      </h3>

      <div className="space-y-4">
        <div>
          <Label>Заголовок</Label>
          <Input
            className="mt-1"
            value={bannerForm.title}
            onChange={(e) => onChange({ ...bannerForm, title: e.target.value })}
            placeholder="Например: С Новым годом!"
          />
        </div>

        <div>
          <Label>Сообщение</Label>
          <Textarea
            className="mt-1 min-h-[80px]"
            value={bannerForm.message}
            onChange={(e) => onChange({ ...bannerForm, message: e.target.value })}
            placeholder="Текст баннера для пользователей"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Начало показа</Label>
            <Input
              type="date"
              className="mt-1"
              value={bannerForm.startDate}
              onChange={(e) => onChange({ ...bannerForm, startDate: e.target.value })}
            />
          </div>
          <div>
            <Label>Конец показа</Label>
            <Input
              type="date"
              className="mt-1"
              value={bannerForm.endDate}
              onChange={(e) => onChange({ ...bannerForm, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Цвет фона</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={bannerForm.backgroundColor}
                onChange={(e) => onChange({ ...bannerForm, backgroundColor: e.target.value })}
                className="h-9 w-14 rounded border cursor-pointer"
              />
              <Input
                value={bannerForm.backgroundColor}
                onChange={(e) => onChange({ ...bannerForm, backgroundColor: e.target.value })}
                placeholder="#4F46E5"
              />
            </div>
          </div>
          <div>
            <Label>Цвет текста</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="color"
                value={bannerForm.textColor}
                onChange={(e) => onChange({ ...bannerForm, textColor: e.target.value })}
                className="h-9 w-14 rounded border cursor-pointer"
              />
              <Input
                value={bannerForm.textColor}
                onChange={(e) => onChange({ ...bannerForm, textColor: e.target.value })}
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>

        <div>
          <Label>Предпросмотр баннера</Label>
          <div
            className="mt-1 rounded-lg px-4 py-3 text-sm font-medium"
            style={{ backgroundColor: bannerForm.backgroundColor, color: bannerForm.textColor }}
          >
            <strong>{bannerForm.title || 'Заголовок'}</strong>
            {bannerForm.message && <span className="ml-2 opacity-80">{bannerForm.message}</span>}
          </div>
        </div>

        <div>
          <Label>Показывать на страницах</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PAGE_OPTIONS.map(page => (
              <button
                key={page.value}
                type="button"
                onClick={() => togglePage(page.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  bannerForm.showOnPages.includes(page.value)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary'
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange({ ...bannerForm, isActive: !bannerForm.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              bannerForm.isActive ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${
              bannerForm.isActive ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <Label
            className="cursor-pointer"
            onClick={() => onChange({ ...bannerForm, isActive: !bannerForm.isActive })}
          >
            {bannerForm.isActive ? 'Баннер включён' : 'Баннер выключен'}
          </Label>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={onSave} disabled={saving}>
            {saving ? 'Сохранение...' : editingBanner ? 'Сохранить изменения' : 'Создать баннер'}
          </Button>
          <Button variant="outline" onClick={onCancel}>Отмена</Button>
        </div>
      </div>
    </div>
  );
}
