import { useMemo, useState } from 'react';
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
            <div className="flex items-center justify-between">
              <Label>{isForwardRequest ? 'Адрес получения / место исполнения' : 'Адрес доставки'}</Label>
              {formData.deliveryAddress.length >= 3 && (
                <AIAssistButton
                  action="improve_title"
                  title={formData.deliveryAddress}
                  onResult={text => set('deliveryAddress', text.slice(0, 300))}
                  label="Улучшить"
                />
              )}
            </div>
            <Input value={formData.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} placeholder="г. Москва, ул. Промышленная, 1" />
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
                      <Input
                        placeholder="Поиск района..."
                        value={districtFilter}
                        onChange={e => setDistrictFilter(e.target.value)}
                        className="h-8 text-sm"
                      />
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