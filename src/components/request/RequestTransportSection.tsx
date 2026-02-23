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
            placeholder="Город отправления — Город назначения"
          />
        </div>

        <div className="space-y-3">
          <Label>Районы обслуживания</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="reqTransportAllDistricts"
              checked={formData.transportAllDistricts}
              onCheckedChange={(checked) => onInputChange('transportAllDistricts', checked as boolean)}
            />
            <label htmlFor="reqTransportAllDistricts" className="text-sm font-medium leading-none cursor-pointer">
              Показывать во всех районах
            </label>
          </div>
          {!formData.transportAllDistricts && (
            <div className="space-y-2">
              <div className="relative">
                <Input
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
              {additionalDistricts.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdditional(v => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon name={showAdditional ? 'ChevronUp' : 'ChevronDown'} size={14} />
                    {showAdditional ? 'Скрыть' : 'Дополнительные районы в регионе'}
                    {formData.availableDistricts.length > 0 && (
                      <span className="ml-1 text-primary font-medium">({formData.availableDistricts.length} выбрано)</span>
                    )}
                  </button>
                  {showAdditional && (
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {additionalDistricts.map(d => (
                        <div key={d.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`req-transport-district-${d.id}`}
                            checked={formData.availableDistricts.includes(d.id)}
                            onCheckedChange={() => onDistrictToggle(d.id)}
                          />
                          <label htmlFor={`req-transport-district-${d.id}`} className="text-xs leading-none cursor-pointer">
                            {d.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
              checked={formData.transportNegotiable}
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
            value={formData.transportComment}
            onChange={(e) => onInputChange('transportComment', e.target.value)}
            placeholder="Дополнительная информация об услуге, условиях, особенностях..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}