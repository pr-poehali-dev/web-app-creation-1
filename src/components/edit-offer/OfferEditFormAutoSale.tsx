import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import type { Offer } from '@/types/offer';

interface EditData {
  pricePerUnit: string;
  quantity: string;
  minOrderQuantity: string;
  description: string;
  deliveryPeriodStart: string;
  deliveryPeriodEnd: string;
  transportPrice: string;
  transportCapacity: string;
  transportDateTime: string;
  transportPriceType: string;
  transportNegotiable: boolean;
  transportWaypoints: import('@/types/offer').TransportWaypoint[];
  transportComment: string;
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
}

interface OfferEditFormAutoSaleProps {
  offer: Offer;
  editData: EditData;
  isSaving: boolean;
  onEditDataChange: (data: EditData) => void;
}

export default function OfferEditFormAutoSale({ offer, editData, isSaving, onEditDataChange }: OfferEditFormAutoSaleProps) {
  const [makeSearch, setMakeSearch] = useState('');
  const [isMakeOpen, setIsMakeOpen] = useState(false);

  const selectedMake = AUTO_MAKES.find(m => m.name === editData.autoMake);
  const modelOptions = selectedMake ? selectedMake.models : [];

  const filteredMakes = AUTO_MAKES.filter(m =>
    m.name.toLowerCase().includes(makeSearch.toLowerCase())
  );

  const handleSelectMake = (makeName: string) => {
    onEditDataChange({ ...editData, autoMake: makeName, autoModel: '' });
    setIsMakeOpen(false);
    setMakeSearch('');
  };

  const set = (field: keyof EditData) => (value: string) =>
    onEditDataChange({ ...editData, [field]: value });

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="pricePerUnit">Цена (₽)</Label>
        <Input
          id="pricePerUnit"
          type="number"
          value={editData.pricePerUnit}
          onChange={(e) => onEditDataChange({ ...editData, pricePerUnit: e.target.value })}
          disabled={isSaving}
          min="0"
          step="1"
        />
      </div>

      <div className="pt-1 font-medium text-sm text-muted-foreground">Основная информация</div>

      <div className="relative">
        <Label htmlFor="autoMake">Марка</Label>
        <div className="relative">
          <Input
            id="autoMake"
            value={isMakeOpen ? makeSearch : editData.autoMake}
            onChange={e => setMakeSearch(e.target.value)}
            onFocus={() => setIsMakeOpen(true)}
            placeholder="Начните вводить марку..."
            className="pr-8"
            autoComplete="off"
            disabled={isSaving}
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
                      editData.autoMake === make.name ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    {make.name}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">Нет совпадений — введите вручную</div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="autoModel">Модель</Label>
        <SearchableSelect
          id="autoModel"
          value={editData.autoModel}
          onChange={set('autoModel')}
          options={modelOptions}
          placeholder={editData.autoMake ? 'Выберите или введите модель...' : 'Сначала выберите марку'}
          disabled={!editData.autoMake || isSaving}
          allowCustom
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="autoYear">Год выпуска</Label>
          <SearchableSelect
            id="autoYear"
            value={editData.autoYear}
            onChange={set('autoYear')}
            options={YEAR_OPTIONS}
            placeholder="Год..."
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="autoBodyType">Тип кузова</Label>
          <SearchableSelect
            id="autoBodyType"
            value={editData.autoBodyType}
            onChange={set('autoBodyType')}
            options={AUTO_BODY_TYPES}
            placeholder="Кузов..."
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="autoColor">Цвет</Label>
          <SearchableSelect
            id="autoColor"
            value={editData.autoColor}
            onChange={set('autoColor')}
            options={AUTO_COLORS}
            placeholder="Цвет..."
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="autoPtsRecords">Записей в ПТС</Label>
          <SearchableSelect
            id="autoPtsRecords"
            value={editData.autoPtsRecords}
            onChange={set('autoPtsRecords')}
            options={AUTO_PTS_RECORDS}
            placeholder="Записи..."
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="pt-1 font-medium text-sm text-muted-foreground">Технические характеристики</div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="autoFuelType">Тип топлива</Label>
          <SearchableSelect
            id="autoFuelType"
            value={editData.autoFuelType}
            onChange={set('autoFuelType')}
            options={AUTO_FUEL_TYPES}
            placeholder="Топливо..."
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="autoTransmission">Коробка передач</Label>
          <SearchableSelect
            id="autoTransmission"
            value={editData.autoTransmission}
            onChange={set('autoTransmission')}
            options={AUTO_TRANSMISSION_TYPES}
            placeholder="КПП..."
            disabled={isSaving}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="autoDriveType">Привод</Label>
          <SearchableSelect
            id="autoDriveType"
            value={editData.autoDriveType}
            onChange={set('autoDriveType')}
            options={AUTO_DRIVE_TYPES}
            placeholder="Привод..."
            disabled={isSaving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="autoMileage">Пробег (км)</Label>
          <Input
            id="autoMileage"
            type="number"
            value={editData.autoMileage}
            onChange={(e) => onEditDataChange({ ...editData, autoMileage: e.target.value })}
            disabled={isSaving}
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="autoDescription">Описание автомобиля</Label>
        <Textarea
          id="autoDescription"
          value={editData.autoDescription}
          onChange={(e) => onEditDataChange({ ...editData, autoDescription: e.target.value })}
          disabled={isSaving}
          rows={3}
          placeholder="Дополнительная информация об автомобиле"
        />
      </div>
    </>
  );
}
