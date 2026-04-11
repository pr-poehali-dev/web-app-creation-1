import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { ContractFormData } from '@/hooks/useContractData';
import { DISTRICTS } from '@/data/districts';
import { useDistrict } from '@/contexts/DistrictContext';

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
  const [noDeliveryOutside, setNoDeliveryOutside] = useState(false);

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
              <Label className="flex items-center gap-1">
                {isForwardRequest ? 'Период исполнения (поставки / оказания услуги) *' : 'Период поставки *'}
                <span className="text-xs text-muted-foreground font-normal">(конечная дата = дата окончания контракта)</span>
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Начало</span>
                  <Input type="date" value={formData.deliveryDate} onChange={e => set('deliveryDate', e.target.value)} />
                </div>
                <Icon name="ArrowRight" size={16} className="text-muted-foreground mt-5 shrink-0" />
                <div className="flex-1 space-y-1">
                  <span className="text-xs text-muted-foreground">Конец (дата окончания контракта) *</span>
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
            <Input value={formData.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} placeholder="г. Москва, ул. Промышленная, 1" />
          </div>

          <div className="space-y-2">
            <Label>Способ доставки</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dt-pickup"
                  checked={formData.deliveryTypes.includes('pickup')}
                  onCheckedChange={() => toggleDeliveryType('pickup')}
                />
                <label htmlFor="dt-pickup" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                  <Icon name="Store" size={15} />
                  Самовывоз
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="dt-delivery"
                  checked={formData.deliveryTypes.includes('delivery')}
                  onCheckedChange={() => toggleDeliveryType('delivery')}
                />
                <label htmlFor="dt-delivery" className="text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                  <Icon name="Truck" size={15} />
                  С доставкой
                </label>
              </div>
            </div>
            {formData.deliveryTypes.length === 0 && (
              <p className="text-xs text-destructive">Выберите хотя бы один способ</p>
            )}
          </div>

          {formData.deliveryTypes.includes('delivery') && (
            <div className="space-y-2">
              <Label>Районы доставки</Label>
              {deliveryDistricts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет доступных районов</p>
              ) : (
                <div className="border rounded-lg p-3 max-h-56 overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {deliveryDistricts.map(d => (
                      <div key={d.id} className="flex items-center gap-2">
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

              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="no-delivery-outside"
                  checked={noDeliveryOutside}
                  onCheckedChange={v => setNoDeliveryOutside(!!v)}
                />
                <label htmlFor="no-delivery-outside" className="text-sm cursor-pointer text-muted-foreground">
                  Доставка только в выбранные районы
                </label>
              </div>
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
