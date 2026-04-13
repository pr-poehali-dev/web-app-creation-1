import { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { ContractFormData } from '@/hooks/useContractData';
import { DISTRICTS } from '@/data/districts';
import { useDistrict } from '@/contexts/DistrictContext';
import AIAssistButton from '@/components/offer/AIAssistButton';

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  city?: string;
  town?: string;
  village?: string;
  suburb?: string;
  county?: string;
  state?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: NominatimAddress;
}

function formatAddress(result: NominatimResult): string {
  const a = result.address;
  if (!a) {
    // fallback: убрать страну, индекс, округ
    const skip = ['Россия', 'Russia', 'Российская Федерация', 'Дальневосточный федеральный округ', 'Сибирский федеральный округ', 'Центральный федеральный округ', 'Приволжский федеральный округ', 'Уральский федеральный округ', 'Северо-Западный федеральный округ', 'Южный федеральный округ', 'Северо-Кавказский федеральный округ'];
    return result.display_name.split(', ').filter(p => !skip.includes(p.trim()) && !/^\d{6}$/.test(p.trim()) && !p.includes('поселение') && !p.includes('улус') && !p.includes('район')).slice(0, 4).join(', ');
  }

  const city = a.city || a.town || a.village || a.suburb || '';
  const rawStreet = a.road || a.pedestrian || '';
  const street = rawStreet.replace(/\bулица\b/gi, 'ул.').replace(/\bпроспект\b/gi, 'пр-т').replace(/\bпереулок\b/gi, 'пер.').replace(/\bбульвар\b/gi, 'б-р').replace(/\bшоссе\b/gi, 'ш.').replace(/\bплощадь\b/gi, 'пл.');
  const house = a.house_number || '';

  const cityFmt = city ? `г. ${city}` : '';
  const parts = [cityFmt, street, house].filter(Boolean);
  return parts.join(', ');
}

function abbreviateStreetTypes(s: string): string {
  return s
    .replace(/\bулица\b/gi, 'ул.')
    .replace(/\bпроспект\b/gi, 'пр-т')
    .replace(/\bпереулок\b/gi, 'пер.')
    .replace(/\bбульвар\b/gi, 'б-р')
    .replace(/\bшоссе\b/gi, 'ш.')
    .replace(/\bплощадь\b/gi, 'пл.');
}

function formatAddressLabel(result: NominatimResult): string {
  const a = result.address;
  if (!a) return result.display_name;
  const city = a.city || a.town || a.village || a.suburb || '';
  const rawStreet = a.road || a.pedestrian || '';
  const street = rawStreet.replace(/\bулица\b/gi, 'ул.').replace(/\bпроспект\b/gi, 'пр-т').replace(/\bпереулок\b/gi, 'пер.').replace(/\bбульвар\b/gi, 'б-р').replace(/\bшоссе\b/gi, 'ш.').replace(/\bплощадь\b/gi, 'пл.');
  const house = a.house_number || '';
  const cityFmt = city ? `г. ${city}` : '';
  return [cityFmt, street, house].filter(Boolean).join(', ');
}

function AddressInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const normalizedOnce = useRef(false);

  // Нормализуем уже сохранённое значение один раз при монтировании
  useEffect(() => {
    if (!normalizedOnce.current && value) {
      normalizedOnce.current = true;
      const normalized = abbreviateStreetTypes(value);
      if (normalized !== value) onChange(normalized);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (value.length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const q = encodeURIComponent(value);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=1`, {
          headers: { 'Accept-Language': 'ru' },
        });
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch { setSuggestions([]); }
      setLoading(false);
    }, 600);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [value]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function locate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude: lat, longitude: lon } = pos.coords;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
          headers: { 'Accept-Language': 'ru' },
        });
        const data = await res.json();
        if (data?.display_name) onChange(formatAddress(data));
      } catch (e) { console.error(e); }
      setLocating(false);
    }, () => setLocating(false));
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={e => onChange(abbreviateStreetTypes(e.target.value))}
            placeholder={placeholder}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={locate}
          disabled={locating}
          title="Определить моё местоположение"
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-md border border-input bg-background hover:bg-accent transition-colors disabled:opacity-50"
        >
          {locating
            ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            : <Icon name="LocateFixed" size={16} />
          }
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors border-b border-border last:border-0"
              onMouseDown={() => { onChange(formatAddress(s)); setSuggestions([]); setOpen(false); }}
            >
              {formatAddressLabel(s)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface ContractDeliverySectionProps {
  formData: ContractFormData;
  set: (field: string, value: string) => void;
  setArray: (field: 'deliveryTypes' | 'deliveryDistricts', values: string[]) => void;
  prepaymentAmount: number;
}

export default function ContractDeliverySection({
  formData,
  set,
  setArray,
  prepaymentAmount,
}: ContractDeliverySectionProps) {
  const isBarter = formData.contractType === 'barter';
  const isForwardRequest = formData.contractType === 'forward-request';
  const { selectedRegion } = useDistrict();
  const [districtFilter, setDistrictFilter] = useState('');
  const [districtsOpen, setDistrictsOpen] = useState(false);

  const deliveryDistricts = useMemo(() => {
    const regionId = selectedRegion && selectedRegion !== 'all' ? selectedRegion : null;
    if (regionId) {
      return DISTRICTS.filter(d => d.regionId === regionId && d.id !== 'all');
    }
    return DISTRICTS.filter(d => d.id !== 'all');
  }, [selectedRegion]);

  const toggleDeliveryType = (type: string) => {
    const current = formData.deliveryTypes;
    const next = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    setArray('deliveryTypes', next);
    if (!next.includes('delivery')) setArray('deliveryDistricts', []);
  };

  const toggleDistrict = (id: string) => {
    const current = formData.deliveryDistricts;
    setArray('deliveryDistricts', current.includes(id) ? current.filter(d => d !== id) : [...current, id]);
  };

  return (
    <>
      {/* Сроки */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Calendar" size={18} />
            Сроки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Дата начала контракта</Label>
              <Input type="date" value={formData.contractStartDate} onChange={e => set('contractStartDate', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{isForwardRequest ? 'Период исполнения *' : 'Период поставки *'}</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Начало</span>
                  <Input type="date" value={formData.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
                </div>
                <Icon name="ArrowRight" size={16} className="text-muted-foreground mt-5 shrink-0" />
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Окончание *</span>
                  <Input
                    type="date"
                    value={formData.contractEndDate}
                    min={formData.deliveryDate || undefined}
                    onChange={e => set('contractEndDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Доставка и оплата */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="Truck" size={18} />
            Доставка и оплата
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>{isForwardRequest ? 'Адрес получения / место исполнения' : 'Адрес доставки'}</Label>
            <AddressInput
              value={formData.deliveryAddress}
              onChange={v => set('deliveryAddress', v)}
              placeholder="г. Москва, ул. Промышленная, 1"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Особые условия доставки</Label>
              {formData.deliveryNotes && formData.deliveryNotes.length >= 3 ? (
                <AIAssistButton
                  action="improve_description"
                  title={formData.deliveryAddress}
                  description={formData.deliveryNotes}
                  onResult={text => set('deliveryNotes', text.slice(0, 1000))}
                  label="Улучшить"
                />
              ) : (!formData.deliveryNotes || formData.deliveryNotes.length === 0) && formData.deliveryAddress.length >= 3 ? (
                <AIAssistButton
                  action="suggest_description"
                  title={`Условия доставки: ${formData.deliveryAddress}`}
                  onResult={text => set('deliveryNotes', text.slice(0, 1000))}
                  label="Сгенерировать"
                />
              ) : null}
            </div>
            <Textarea
              value={formData.deliveryNotes || ''}
              onChange={e => set('deliveryNotes', e.target.value)}
              rows={2}
              placeholder="Особые требования к доставке, упаковке, режим работы склада..."
            />
          </div>

          <div className="space-y-2">
            <Label className="block mb-1">Способы получения *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dt-pickup"
                  checked={formData.deliveryTypes.includes('pickup')}
                  onCheckedChange={() => toggleDeliveryType('pickup')}
                />
                <label htmlFor="dt-pickup" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <Icon name="Store" size={16} />
                  Самовывоз
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dt-delivery"
                  checked={formData.deliveryTypes.includes('delivery')}
                  onCheckedChange={() => toggleDeliveryType('delivery')}
                />
                <label htmlFor="dt-delivery" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                  <Icon name="Truck" size={16} />
                  Доставка
                </label>
              </div>
            </div>
            {formData.deliveryTypes.length === 0 && (
              <p className="text-xs text-destructive mt-1">Выберите хотя бы один способ получения</p>
            )}
          </div>

          {formData.deliveryTypes.includes('delivery') && (
            <div className="space-y-2">
              <Label>Доставка в другие районы:</Label>
              {deliveryDistricts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет доступных районов</p>
              ) : (
                <div className="space-y-3">
                  {/* Нет */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dd-none"
                      checked={formData.deliveryDistricts.length === 0}
                      onCheckedChange={() => {
                        setArray('deliveryDistricts', []);
                        setDistrictsOpen(false);
                      }}
                    />
                    <label htmlFor="dd-none" className="text-sm cursor-pointer">Нет</label>
                  </div>

                  {/* Кнопка открыть/скрыть список */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDistrictsOpen(v => !v)}
                    className="gap-1.5 text-xs"
                  >
                    <Icon name={districtsOpen ? 'ChevronUp' : 'ChevronDown'} size={14} />
                    {districtsOpen
                      ? 'Скрыть список районов'
                      : formData.deliveryDistricts.length > 0
                        ? `Выбрано районов: ${formData.deliveryDistricts.length}`
                        : 'Выбрать районы доставки'}
                  </Button>

                  {/* Список районов с фильтром */}
                  {districtsOpen && (
                    <div className="border rounded-lg p-3 space-y-3">
                      <div className="relative">
                        <Input
                          placeholder="Поиск района..."
                          value={districtFilter}
                          onChange={e => setDistrictFilter(e.target.value)}
                          className="h-8 text-sm pr-7"
                        />
                        {districtFilter && (
                          <button
                            type="button"
                            onClick={() => setDistrictFilter('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <Icon name="X" size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2 max-h-60 overflow-y-auto">
                        {deliveryDistricts
                          .filter(d => d.name.toLowerCase().includes(districtFilter.toLowerCase()))
                          .map(d => (
                            <div key={d.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`dd-${d.id}`}
                                checked={formData.deliveryDistricts.includes(d.id)}
                                onCheckedChange={() => toggleDistrict(d.id)}
                              />
                              <label htmlFor={`dd-${d.id}`} className="text-sm cursor-pointer leading-tight">{d.name}</label>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!isBarter && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Предоплата (%)</Label>
                <Input type="number" step="1" min="0" max="100" value={formData.prepaymentPercent} onChange={e => set('prepaymentPercent', e.target.value)} placeholder="30" />
              </div>
              <div className="space-y-1">
                <Label>Сумма предоплаты (₽)</Label>
                <Input value={prepaymentAmount ? prepaymentAmount.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) : '0'} disabled />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}