import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { type BannerItem, type BannerFormState, PAGE_OPTIONS } from './types';
import { REGIONS } from '@/data/regions';
import { DISTRICTS } from '@/data/districts';

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

  const toggleRegion = (regionId: string) => {
    const isSelected = bannerForm.showRegions.includes(regionId);
    const newRegions = isSelected
      ? bannerForm.showRegions.filter(r => r !== regionId)
      : [...bannerForm.showRegions, regionId];
    let newDistricts = bannerForm.showDistricts;
    if (isSelected) {
      const regionDistrictIds = DISTRICTS.filter(d => d.regionId === regionId).map(d => d.id);
      newDistricts = newDistricts.filter(d => !regionDistrictIds.includes(d));
    }
    onChange({ ...bannerForm, showRegions: newRegions, showDistricts: newDistricts });
  };

  const toggleDistrict = (districtId: string) => {
    const districts = bannerForm.showDistricts.includes(districtId)
      ? bannerForm.showDistricts.filter(d => d !== districtId)
      : [...bannerForm.showDistricts, districtId];
    onChange({ ...bannerForm, showDistricts: districts });
  };

  const toggleAllDistricts = (regionId: string) => {
    const regionDistricts = DISTRICTS.filter(d => d.regionId === regionId).map(d => d.id);
    const allSelected = regionDistricts.every(d => bannerForm.showDistricts.includes(d));
    const newDistricts = allSelected
      ? bannerForm.showDistricts.filter(d => !regionDistricts.includes(d))
      : [...new Set([...bannerForm.showDistricts, ...regionDistricts])];
    onChange({ ...bannerForm, showDistricts: newDistricts });
  };

  const districtsByRegion = bannerForm.showRegions.map(regionId => ({
    region: REGIONS.find(r => r.id === regionId),
    districts: DISTRICTS.filter(d => d.regionId === regionId),
  })).filter(g => g.region && g.districts.length > 0);

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
          <Label>Сообщение (полный текст при раскрытии)</Label>
          <Textarea
            className="mt-1 min-h-[80px]"
            value={bannerForm.message}
            onChange={(e) => onChange({ ...bannerForm, message: e.target.value })}
            placeholder="Текст новости, поздравления или объявления"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Начало показа</Label>
            <Input type="date" className="mt-1" value={bannerForm.startDate}
              onChange={(e) => onChange({ ...bannerForm, startDate: e.target.value })} />
          </div>
          <div>
            <Label>Конец показа</Label>
            <Input type="date" className="mt-1" value={bannerForm.endDate}
              onChange={(e) => onChange({ ...bannerForm, endDate: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Цвет фона</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={bannerForm.backgroundColor}
                onChange={(e) => onChange({ ...bannerForm, backgroundColor: e.target.value })}
                className="h-9 w-14 rounded border cursor-pointer" />
              <Input value={bannerForm.backgroundColor} placeholder="#4F46E5"
                onChange={(e) => onChange({ ...bannerForm, backgroundColor: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Цвет текста</Label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={bannerForm.textColor}
                onChange={(e) => onChange({ ...bannerForm, textColor: e.target.value })}
                className="h-9 w-14 rounded border cursor-pointer" />
              <Input value={bannerForm.textColor} placeholder="#FFFFFF"
                onChange={(e) => onChange({ ...bannerForm, textColor: e.target.value })} />
            </div>
          </div>
        </div>

        <div>
          <Label>Предпросмотр</Label>
          <div className="mt-1 rounded-lg px-4 py-2.5 text-sm"
            style={{ backgroundColor: bannerForm.backgroundColor, color: bannerForm.textColor }}>
            <strong>{bannerForm.title || 'Заголовок баннера'}</strong>
            <span className="ml-2 opacity-70 text-xs hidden sm:inline">
              {bannerForm.message ? bannerForm.message.slice(0, 60) + (bannerForm.message.length > 60 ? '...' : '') : 'Текст сообщения'}
            </span>
          </div>
        </div>

        <div>
          <Label>Показывать на страницах</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PAGE_OPTIONS.map(page => (
              <button key={page.value} type="button" onClick={() => togglePage(page.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  bannerForm.showOnPages.includes(page.value)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary'
                }`}>
                {page.label}
              </button>
            ))}
          </div>
        </div>

        {/* Регионы */}
        <div>
          <Label>Регионы показа</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            Не выбрано — показывается всем. Выбери регион, затем уточни районы.
          </p>
          <div className="border rounded-lg overflow-hidden">
            <button type="button"
              onClick={() => onChange({ ...bannerForm, showRegions: [], showDistricts: [] })}
              className={`w-full text-left px-3 py-2 text-sm font-medium border-b transition-colors ${
                bannerForm.showRegions.length === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}>
              🌍 Все регионы
            </button>
            <div className="max-h-40 overflow-y-auto">
              {REGIONS.map(region => (
                <button key={region.id} type="button" onClick={() => toggleRegion(region.id)}
                  className={`w-full text-left px-3 py-2 text-sm border-b last:border-b-0 transition-colors ${
                    bannerForm.showRegions.includes(region.id)
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'bg-background text-foreground hover:bg-muted'
                  }`}>
                  {bannerForm.showRegions.includes(region.id) ? '✓ ' : ''}{region.name}
                </button>
              ))}
            </div>
          </div>
          {bannerForm.showRegions.length > 0 && (
            <p className="text-xs text-primary mt-1">Выбрано регионов: {bannerForm.showRegions.length}</p>
          )}
        </div>

        {/* Районы — показываем только если выбраны регионы */}
        {districtsByRegion.length > 0 && (
          <div>
            <Label>Районы показа</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Не выбрано — показывается всему региону целиком.
            </p>
            <div className="space-y-2">
              {districtsByRegion.map(({ region, districts }) => {
                const allSelected = districts.every(d => bannerForm.showDistricts.includes(d.id));
                const someSelected = districts.some(d => bannerForm.showDistricts.includes(d.id));
                return (
                  <div key={region!.id} className="border rounded-lg overflow-hidden">
                    <button type="button" onClick={() => toggleAllDistricts(region!.id)}
                      className={`w-full text-left px-3 py-2 text-sm font-semibold border-b transition-colors ${
                        allSelected ? 'bg-primary/10 text-primary' : someSelected ? 'bg-primary/5 text-primary' : 'bg-muted text-foreground hover:bg-muted/80'
                      }`}>
                      {allSelected ? '✓ ' : someSelected ? '— ' : ''}{region!.name}
                      <span className="text-xs font-normal ml-1 opacity-60">
                        {allSelected ? 'все районы' : someSelected
                          ? `${districts.filter(d => bannerForm.showDistricts.includes(d.id)).length} из ${districts.length}`
                          : 'выбрать все'}
                      </span>
                    </button>
                    <div className="max-h-36 overflow-y-auto">
                      {districts.map(district => (
                        <button key={district.id} type="button" onClick={() => toggleDistrict(district.id)}
                          className={`w-full text-left px-3 py-1.5 text-sm border-b last:border-b-0 transition-colors ${
                            bannerForm.showDistricts.includes(district.id)
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'bg-background text-foreground hover:bg-muted'
                          }`}>
                          {bannerForm.showDistricts.includes(district.id) ? '✓ ' : ''}{district.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {bannerForm.showDistricts.length === 0 && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-2">
                Районы не выбраны — баннер покажется всем пользователям выбранных регионов
              </p>
            )}
            {bannerForm.showDistricts.length > 0 && (
              <p className="text-xs text-primary mt-1">Выбрано районов: {bannerForm.showDistricts.length}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="button"
            onClick={() => onChange({ ...bannerForm, isActive: !bannerForm.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              bannerForm.isActive ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow ${
              bannerForm.isActive ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
          <Label className="cursor-pointer"
            onClick={() => onChange({ ...bannerForm, isActive: !bannerForm.isActive })}>
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
