import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import SearchableSelect from '@/components/ui/SearchableSelect';
import {
  AUTO_MAKES,
  AUTO_BODY_TYPES,
  AUTO_COLORS,
  AUTO_FUEL_TYPES,
  AUTO_TRANSMISSION_TYPES,
  AUTO_DRIVE_TYPES,
  AUTO_PTS_RECORDS,
  YEAR_OPTIONS,
} from '@/data/autoData';

interface AutoFormData {
  autoMake: string;
  autoModel: string;
  autoYear: string;
  autoBodyType: string;
  autoColor: string;
  autoFuelType: string;
  autoTransmission: string;
  autoDriveType: string;
  autoMileage: string;
  autoPtsRecords: string;
  autoDescription: string;
  pricePerUnit: string;
  expiryDate: string;
}

interface OfferAutoSectionProps {
  formData: AutoFormData;
  onInputChange: (field: string, value: string | boolean) => void;
}

export default function OfferAutoSection({ formData, onInputChange }: OfferAutoSectionProps) {
  const [makeSearch, setMakeSearch] = useState('');
  const [isMakeOpen, setIsMakeOpen] = useState(false);

  const selectedMake = AUTO_MAKES.find(m => m.name === formData.autoMake);
  const modelOptions = selectedMake ? selectedMake.models : [];

  const filteredMakes = AUTO_MAKES.filter(m =>
    m.name.toLowerCase().includes(makeSearch.toLowerCase())
  );

  const handleSelectMake = (makeName: string) => {
    onInputChange('autoMake', makeName);
    onInputChange('autoModel', '');
    setIsMakeOpen(false);
    setMakeSearch('');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Основная информация об автомобиле</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Label htmlFor="autoMake">Компания производитель *</Label>
              <div className="relative">
                <Input
                  id="autoMake"
                  value={isMakeOpen ? makeSearch : formData.autoMake}
                  onChange={e => setMakeSearch(e.target.value)}
                  onFocus={() => setIsMakeOpen(true)}
                  placeholder="Начните вводить марку..."
                  className="pr-8"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setIsMakeOpen(v => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <span className="text-muted-foreground text-xs">{isMakeOpen ? '▲' : '▼'}</span>
                </button>
              </div>
              {isMakeOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => { setIsMakeOpen(false); setMakeSearch(''); }} />
                  <div className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-background border border-input rounded-md shadow-lg">
                    {makeSearch && !AUTO_MAKES.some(m => m.name.toLowerCase() === makeSearch.toLowerCase()) && (
                      <button
                        type="button"
                        onClick={() => handleSelectMake(makeSearch)}
                        className="w-full text-left px-3 py-2 text-sm border-b border-input hover:bg-accent transition-colors text-primary font-medium"
                      >
                        Использовать: «{makeSearch}»
                      </button>
                    )}
                    {filteredMakes.length > 0 ? (
                      filteredMakes.map(make => (
                        <button
                          key={make.id}
                          type="button"
                          onClick={() => handleSelectMake(make.name)}
                          className={`w-full text-left px-3 py-2 text-sm border-b border-input last:border-b-0 hover:bg-accent transition-colors ${
                            formData.autoMake === make.name ? 'bg-accent font-medium' : ''
                          }`}
                        >
                          {make.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Нет совпадений — введите название вручную выше</div>
                    )}
                  </div>
                </>
              )}
              <p className="text-xs text-muted-foreground mt-1">Можно выбрать из списка или ввести вручную</p>
            </div>

            <div>
              <Label htmlFor="autoModel">Модель авто *</Label>
              <SearchableSelect
                id="autoModel"
                value={formData.autoModel}
                onChange={v => onInputChange('autoModel', v)}
                options={modelOptions}
                placeholder={formData.autoMake ? 'Выберите или введите модель...' : 'Сначала выберите производителя'}
                disabled={!formData.autoMake}
                allowCustom
              />
              <p className="text-xs text-muted-foreground mt-1">Можно выбрать из списка или ввести вручную</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="autoYear">Год выпуска *</Label>
              <SearchableSelect
                id="autoYear"
                value={formData.autoYear}
                onChange={v => onInputChange('autoYear', v)}
                options={YEAR_OPTIONS}
                placeholder="Выберите год..."
              />
            </div>

            <div>
              <Label htmlFor="autoBodyType">Тип кузова *</Label>
              <SearchableSelect
                id="autoBodyType"
                value={formData.autoBodyType}
                onChange={v => onInputChange('autoBodyType', v)}
                options={AUTO_BODY_TYPES}
                placeholder="Выберите тип кузова..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="autoColor">Цвет *</Label>
              <SearchableSelect
                id="autoColor"
                value={formData.autoColor}
                onChange={v => onInputChange('autoColor', v)}
                options={AUTO_COLORS}
                placeholder="Выберите цвет..."
              />
            </div>

            <div>
              <Label htmlFor="autoPtsRecords">Количество записей в ПТС *</Label>
              <SearchableSelect
                id="autoPtsRecords"
                value={formData.autoPtsRecords}
                onChange={v => onInputChange('autoPtsRecords', v)}
                options={AUTO_PTS_RECORDS}
                placeholder="Выберите количество записей..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Технические характеристики</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="autoFuelType">Тип топлива</Label>
              <SearchableSelect
                id="autoFuelType"
                value={formData.autoFuelType}
                onChange={v => onInputChange('autoFuelType', v)}
                options={AUTO_FUEL_TYPES}
                placeholder="Выберите тип топлива..."
              />
            </div>

            <div>
              <Label htmlFor="autoTransmission">Коробка передач</Label>
              <SearchableSelect
                id="autoTransmission"
                value={formData.autoTransmission}
                onChange={v => onInputChange('autoTransmission', v)}
                options={AUTO_TRANSMISSION_TYPES}
                placeholder="Выберите тип КПП..."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="autoDriveType">Привод</Label>
              <SearchableSelect
                id="autoDriveType"
                value={formData.autoDriveType}
                onChange={v => onInputChange('autoDriveType', v)}
                options={AUTO_DRIVE_TYPES}
                placeholder="Выберите тип привода..."
              />
            </div>

            <div>
              <Label htmlFor="autoMileage">Пробег (км)</Label>
              <Input
                id="autoMileage"
                type="number"
                min="0"
                value={formData.autoMileage}
                onChange={e => onInputChange('autoMileage', e.target.value)}
                placeholder="Например: 85000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Цена и описание</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="autoPricePerUnit">Цена (₽) *</Label>
            <Input
              id="autoPricePerUnit"
              type="number"
              min="0"
              value={formData.pricePerUnit}
              onChange={e => onInputChange('pricePerUnit', e.target.value)}
              placeholder="Укажите цену в рублях"
              required
            />
          </div>

          <div>
            <Label htmlFor="autoDescription">Описание (необязательно)</Label>
            <Textarea
              id="autoDescription"
              value={formData.autoDescription}
              onChange={e => onInputChange('autoDescription', e.target.value)}
              placeholder="Дополнительная информация об автомобиле: комплектация, состояние, история обслуживания..."
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.autoDescription.length}/2000 символов
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Период актуальности объявления</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="autoExpiryDate">Дата снятия с публикации *</Label>
            <Input
              id="autoExpiryDate"
              type="date"
              min={today}
              value={formData.expiryDate}
              onChange={e => onInputChange('expiryDate', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              После этой даты объявление автоматически снимается с публикации
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}