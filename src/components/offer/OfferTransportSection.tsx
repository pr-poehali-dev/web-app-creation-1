import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';

interface OfferTransportSectionProps {
  formData: {
    transportServiceType: string;
    transportRoute: string;
    transportType: string;
    transportCapacity: string;
    transportDateTime: string;
    transportPrice: string;
    transportPriceType: string;
    transportNegotiable?: boolean;
    transportComment?: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
}

const SERVICE_TYPES = [
  'Пассажирские перевозки',
  'Грузоперевозки',
  'Аренда транспорта',
  'Доставка',
];

const TRANSPORT_TYPES = [
  'Легковой автомобиль',
  'Минивэн',
  'Автобус',
  'Грузовик',
  'Спецтехника',
];

const PRICE_TYPES = [
  'За рейс',
  'За час',
  'За км',
  'За тонну',
  'За место',
  'Договорная',
];

function CollapsibleSelectList({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <Label className="cursor-pointer text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          {value ? (
            <span className="text-xs font-medium text-foreground">{value}</span>
          ) : placeholder ? (
            <span className="text-xs text-muted-foreground">{placeholder}</span>
          ) : null}
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
        </div>
      </button>
      {open && (
        <div className="flex flex-col gap-1 pt-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(value === opt ? '' : opt);
                setOpen(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-md border text-sm text-left transition-colors ${
                value === opt
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <span>{opt}</span>
              {value === opt && <Icon name="Check" size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OfferTransportSection({ formData, onInputChange }: OfferTransportSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Транспортные услуги</CardTitle>
        <CardDescription>Укажите детали перевозки</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <CollapsibleSelectList
          label="Тип услуги *"
          placeholder="Выберите тип услуги"
          options={SERVICE_TYPES}
          value={formData.transportServiceType}
          onChange={(v) => {
            onInputChange('transportServiceType', v);
            onInputChange('title', v);
          }}
        />

        <div className="space-y-2">
          <Label htmlFor="transportRoute">Маршрут *</Label>
          <Input
            id="transportRoute"
            value={formData.transportRoute}
            onChange={(e) => onInputChange('transportRoute', e.target.value)}
            placeholder="Город отправления — Город назначения"
          />
        </div>

        <CollapsibleSelectList
          label="Тип транспорта *"
          placeholder="Выберите тип транспорта"
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
          <Label htmlFor="transportDateTime">Дата и время</Label>
          <Input
            id="transportDateTime"
            type="datetime-local"
            value={formData.transportDateTime}
            onChange={(e) => onInputChange('transportDateTime', e.target.value)}
          />
        </div>

        <CollapsibleSelectList
          label="Тип цены"
          placeholder="Выберите тип цены"
          options={PRICE_TYPES}
          value={formData.transportPriceType}
          onChange={(v) => onInputChange('transportPriceType', v)}
        />

        <div className="space-y-2">
          <Label htmlFor="transportPrice">Стоимость (₽)</Label>
          <Input
            id="transportPrice"
            type="number"
            value={formData.transportPrice}
            onChange={(e) => onInputChange('transportPrice', e.target.value)}
            placeholder="0"
            min="0"
            disabled={formData.transportNegotiable}
          />
          <div className="flex items-center space-x-2 mt-1">
            <Checkbox
              id="transportNegotiable"
              checked={formData.transportNegotiable || false}
              onCheckedChange={(checked) => {
                onInputChange('transportNegotiable', checked as boolean);
                if (checked) onInputChange('transportPrice', '');
              }}
            />
            <label
              htmlFor="transportNegotiable"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Ваша цена (Торг)
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transportComment">Комментарий</Label>
          <Textarea
            id="transportComment"
            value={formData.transportComment || ''}
            onChange={(e) => onInputChange('transportComment', e.target.value)}
            placeholder="Дополнительная информация об услуге, условиях, особенностях..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}