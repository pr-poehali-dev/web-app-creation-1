import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OfferTransportSectionProps {
  formData: {
    transportServiceType: string;
    transportRoute: string;
    transportType: string;
    transportCapacity: string;
    transportDateTime: string;
    transportPrice: string;
    transportPriceType: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

const SERVICE_TYPES = [
  'Пассажирские перевозки',
  'Грузоперевозки',
  'Аренда транспорта',
  'Доставка',
];

const ROUTE_TYPES = [
  'Местные перевозки',
  'Междугородние',
];

const TRANSPORT_TYPES = [
  'Легковой автомобиль',
  'Минивэн',
  'Автобус',
  'Грузовик',
  'Спецтехника',
];

const PRICE_TYPES = [
  { value: 'per_km', label: 'За км' },
  { value: 'per_ton', label: 'За тонну' },
  { value: 'per_hour', label: 'За час' },
  { value: 'negotiable', label: 'Договорная' },
];

function SelectGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? '' : opt)}
            className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
              value === opt
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OfferTransportSection({ formData, onInputChange }: OfferTransportSectionProps) {
  const [routeMode, setRouteMode] = useState<'preset' | 'custom'>('preset');
  const isNegotiable = formData.transportPriceType === 'negotiable';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Транспортные услуги</CardTitle>
        <CardDescription>Укажите детали перевозки</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <SelectGroup
          label="Тип услуги *"
          options={SERVICE_TYPES}
          value={formData.transportServiceType}
          onChange={(v) => onInputChange('transportServiceType', v)}
        />

        <div className="space-y-2">
          <Label>Маршрут *</Label>
          <div className="flex gap-2 mb-2">
            {ROUTE_TYPES.map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => {
                  setRouteMode('preset');
                  onInputChange('transportRoute', rt);
                }}
                className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                  formData.transportRoute === rt
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {rt}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setRouteMode('custom');
                onInputChange('transportRoute', '');
              }}
              className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                routeMode === 'custom' && !ROUTE_TYPES.includes(formData.transportRoute)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Указать маршрут
            </button>
          </div>
          {(routeMode === 'custom' || (!ROUTE_TYPES.includes(formData.transportRoute) && formData.transportRoute)) && (
            <Input
              value={ROUTE_TYPES.includes(formData.transportRoute) ? '' : formData.transportRoute}
              onChange={(e) => onInputChange('transportRoute', e.target.value)}
              placeholder="Город отправления — Город назначения"
            />
          )}
        </div>

        <SelectGroup
          label="Тип транспорта *"
          options={TRANSPORT_TYPES}
          value={formData.transportType}
          onChange={(v) => onInputChange('transportType', v)}
        />

        <div className="space-y-2">
          <Label htmlFor="transportCapacity">Вместимость / Грузоподъёмность</Label>
          <Input
            id="transportCapacity"
            value={formData.transportCapacity}
            onChange={(e) => onInputChange('transportCapacity', e.target.value)}
            placeholder="Кол-во пассажиров или кг / м³"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transportDateTime">Дата и время *</Label>
          <Input
            id="transportDateTime"
            type="datetime-local"
            value={formData.transportDateTime}
            onChange={(e) => onInputChange('transportDateTime', e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className="space-y-2">
          <Label>Тип цены *</Label>
          <div className="flex flex-wrap gap-2">
            {PRICE_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => {
                  onInputChange('transportPriceType', pt.value);
                  if (pt.value === 'negotiable') onInputChange('transportPrice', '');
                }}
                className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                  formData.transportPriceType === pt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {pt.label}
              </button>
            ))}
          </div>
        </div>

        {!isNegotiable && (
          <div className="space-y-2">
            <Label htmlFor="transportPrice">Ориентировочная стоимость (₽)</Label>
            <Input
              id="transportPrice"
              type="number"
              value={formData.transportPrice}
              onChange={(e) => onInputChange('transportPrice', e.target.value)}
              placeholder="0"
              min="0"
              step="1"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
