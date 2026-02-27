import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Icon from '@/components/ui/icon';
import { useDistrict } from '@/contexts/DistrictContext';
import { DISTRICTS } from '@/data/districts';

interface RequestTransportSectionProps {
  formData: {
    transportServiceType: string;
    transportRoute: string;
    transportType: string;
    transportCapacity: string;
    transportDateTime: string;
    transportDepartureDateTime: string;
    transportPrice: string;
    transportPriceType: string;
    transportNegotiable: boolean;
    transportComment: string;
    availableDistricts: string[];
    transportAllDistricts: boolean;
    district: string;
  };
  onInputChange: (field: string, value: string | boolean) => void;
  onDistrictToggle: (districtId: string) => void;
}

function formatRoute(raw: string): string {
  return raw
    .trim()
    .split(/[\s\-–—]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('-');
}

const SERVICE_TYPES = [
  'Пассажирские перевозки',
  'Грузоперевозки',
  'Аренда транспорта',
  'Доставка',
];

const TRANSPORT_TYPES_CARGO = [
  'Микроавтобус',
  'Грузовик',
  'Теплый/Холодный рефрижератор',
  'Открытый фургон',
  'Спецтехника',
];

const TRANSPORT_TYPES_PASSENGER = [
  'По умолчанию',
  'Легковой автомобиль',
  'Кроссовер',
  'Минивэн',
  'Микроавтобус',
  'Автобус',
  'Спецтехника',
];

const TRANSPORT_TYPES_DEFAULT = [
  'По умолчанию',
  'Легковой автомобиль',
  'Кроссовер',
  'Минивэн',
  'Микроавтобус',
  'Автобус',
  'Грузовик',
  'Спецтехника',
];

const PRICE_TYPES_ALL = [
  'За рейс',
  'За час',
  'За км',
  'За тонну',
  'За место',
  'Договорная',
];

const PRICE_TYPES_PASSENGER = [
  'За рейс',
  'За час',
  'За км',
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
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {value ? (
            <span className="text-xs font-medium">{value}</span>
          ) : placeholder ? (
            <span className="text-xs md:text-sm font-bold text-green-500">{placeholder}</span>
          ) : null}
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
        </div>
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 pt-2">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(value === opt ? '' : opt);
                setOpen(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                value === opt
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background text-foreground border-input hover:bg-accent'
              }`}
            >
              {value === opt && <Icon name="Check" size={13} />}
              <span>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RequestTransportSection({ formData, onInputChange, onDistrictToggle }: RequestTransportSectionProps) {
  const { detectedDistrictId } = useDistrict();
  const [districtInput, setDistrictInput] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);

  useEffect(() => {
    const autoDistrict = formData.district || detectedDistrictId || '';
    if (autoDistrict && !formData.district) {
      onInputChange('district', autoDistrict);
    }
    const found = DISTRICTS.find(d => d.id === (formData.district || autoDistrict));
    if (found) setDistrictInput(found.name);
  }, [detectedDistrictId]);

  useEffect(() => {
    const found = DISTRICTS.find(d => d.id === formData.district);
    if (found) setDistrictInput(found.name);
  }, [formData.district]);

  const filteredDistricts = useMemo(() => {
    if (!districtInput || districtInput.length < 1) return [];
    const current = DISTRICTS.find(d => d.id === formData.district);
    if (current && districtInput === current.name) return [];
    return DISTRICTS.filter(d =>
      d.name.toLowerCase().includes(districtInput.toLowerCase()) && d.id !== 'all'
    ).slice(0, 6);
  }, [districtInput, formData.district]);

  const additionalDistricts = useMemo(() => {
    if (!formData.district) return [];
    const current = DISTRICTS.find(d => d.id === formData.district);
    if (!current) return [];
    return DISTRICTS.filter(d => d.regionId === current.regionId && d.id !== 'all' && d.id !== formData.district);
  }, [formData.district]);

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
          onChange={(v) => onInputChange('transportServiceType', v)}
        />

        <div className="space-y-2">
          <Label htmlFor="transportRoute">Маршрут *</Label>
          <Input
            id="transportRoute"
            value={formData.transportRoute}
            onChange={(e) => onInputChange('transportRoute', e.target.value)}
            onBlur={(e) => {
              const formatted = formatRoute(e.target.value);
              if (formatted) onInputChange('transportRoute', formatted);
            }}
            placeholder="Нюрба-Якутск"
          />
        </div>

        <div className="space-y-3">
          <Label>Районы обслуживания</Label>
          <div className="space-y-2">
            <Label htmlFor="district" className="text-xs text-muted-foreground font-normal">Основной район *</Label>
            <div className="relative">
              <Input
                id="district"
                value={districtInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setDistrictInput(value);
                  const matched = DISTRICTS.find(d => d.name.toLowerCase() === value.toLowerCase() && d.id !== 'all');
                  if (matched) onInputChange('district', matched.id);
                }}
                placeholder="Начните вводить название района..."
                className="text-sm"
              />
              {filteredDistricts.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md">
                  {filteredDistricts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                      onClick={() => {
                        setDistrictInput(d.name);
                        onInputChange('district', d.id);
                      }}
                    >
                      <Icon name="MapPin" className="h-4 w-4 text-muted-foreground" />
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => setShowAdditional(v => !v)}
                className="flex items-center gap-1 text-xs md:text-sm font-bold text-green-500 hover:text-green-600 transition-colors mt-1"
              >
                <Icon name={showAdditional ? 'ChevronUp' : 'ChevronDown'} size={14} />
                {showAdditional ? 'Скрыть дополнительные районы' : 'Дополнительные районы в регионе'}
                {formData.availableDistricts.length > 0 && (
                  <span className="ml-1 text-primary font-medium">({formData.availableDistricts.length} выбрано)</span>
                )}
              </button>
              {showAdditional && (
                <div className="mt-2">
                  {additionalDistricts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Сначала выберите основной район</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5">
                      {additionalDistricts.map(d => (
                        <div key={d.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`transport-district-${d.id}`}
                            checked={formData.availableDistricts.includes(d.id)}
                            onCheckedChange={() => onDistrictToggle(d.id)}
                          />
                          <label htmlFor={`transport-district-${d.id}`} className="text-xs leading-none cursor-pointer">
                            {d.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <CollapsibleSelectList
          label="Желаемый тип транспорта *"
          placeholder="Выберите тип транспорта"
          options={
            formData.transportServiceType === 'Грузоперевозки'
              ? TRANSPORT_TYPES_CARGO
              : formData.transportServiceType === 'Пассажирские перевозки'
              ? TRANSPORT_TYPES_PASSENGER
              : TRANSPORT_TYPES_DEFAULT
          }
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

        {formData.transportServiceType === 'Пассажирские перевозки' ? (
          <div className="space-y-2">
            <Label htmlFor="transportDepartureDateTime">Желаемая дата и время выезда</Label>
            <Input
              id="transportDepartureDateTime"
              type="datetime-local"
              value={formData.transportDepartureDateTime}
              onChange={(e) => onInputChange('transportDepartureDateTime', e.target.value)}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="transportDateTime">Дата и время</Label>
            <Input
              id="transportDateTime"
              type="datetime-local"
              value={formData.transportDateTime}
              onChange={(e) => onInputChange('transportDateTime', e.target.value)}
            />
          </div>
        )}

        <CollapsibleSelectList
          label="Тип цены"
          placeholder="Выберите тип цены"
          options={
            formData.transportServiceType === 'Пассажирские перевозки'
              ? PRICE_TYPES_PASSENGER
              : PRICE_TYPES_ALL
          }
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