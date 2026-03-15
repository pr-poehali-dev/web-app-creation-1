import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { TransportWaypoint } from '@/types/offer';
import CollapsibleSelectList from './CollapsibleSelectList';
import TransportDistrictSection from './TransportDistrictSection';
import {
  SERVICE_TYPES,
  TRANSPORT_TYPES,
  CARGO_TRANSPORT_TYPES,
  PRICE_TYPES,
  formatRoute,
} from './transportConstants';

interface OfferTransportSectionProps {
  formData: {
    transportServiceType: string;
    transportRoute: string;
    transportType: string;
    transportCapacity: string;
    transportDateTime: string;
    transportDepartureDateTime?: string;
    transportPrice: string;
    transportPriceType: string;
    transportNegotiable?: boolean;
    transportComment?: string;
    availableDistricts: string[];
    transportAllDistricts: boolean;
    district: string;
  };
  transportWaypoints?: TransportWaypoint[];
  onInputChange: (field: string, value: string | boolean) => void;
  onDistrictToggle: (districtId: string) => void;
  onAddWaypoint?: (districtId: string, districtName: string) => void;
  onRemoveWaypoint?: (districtId: string) => void;
  onWaypointPriceChange?: (districtId: string, price: string) => void;
}

export default function OfferTransportSection({ formData, transportWaypoints = [], onInputChange, onDistrictToggle, onAddWaypoint, onRemoveWaypoint, onWaypointPriceChange }: OfferTransportSectionProps) {
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
            onBlur={(e) => {
              const raw = e.target.value;
              if (!raw.trim()) return;
              onInputChange('transportRoute', formatRoute(raw));
            }}
            placeholder="Город отправления — Город назначения"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="transportPrice">Стоимость (₽)</Label>
          <Input
            id="transportPrice"
            type="number"
            value={formData.transportPrice}
            onChange={(e) => onInputChange('transportPrice', e.target.value)}
            placeholder="0"
            min="0"
            step="100"
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

        <TransportDistrictSection
          formData={formData}
          transportWaypoints={transportWaypoints}
          onInputChange={onInputChange}
          onDistrictToggle={onDistrictToggle}
          onAddWaypoint={onAddWaypoint}
          onRemoveWaypoint={onRemoveWaypoint}
          onWaypointPriceChange={onWaypointPriceChange}
        />

        <CollapsibleSelectList
          label="Тип транспорта *"
          placeholder="Выберите тип транспорта"
          options={formData.transportServiceType === 'Грузоперевозки'
            ? CARGO_TRANSPORT_TYPES
            : formData.transportServiceType === 'Пассажирские перевозки'
            ? TRANSPORT_TYPES.filter(t => t !== 'Грузовик')
            : TRANSPORT_TYPES}
          value={formData.transportType}
          onChange={(v) => onInputChange('transportType', v)}
        />

        <div className="space-y-2">
          <Label htmlFor="transportCapacity">Вместимость / Грузоподъёмность</Label>
          <Input
            id="transportCapacity"
            value={formData.transportCapacity}
            onChange={(e) => onInputChange('transportCapacity', e.target.value)}
            placeholder={formData.transportServiceType === 'Грузоперевозки' ? 'Вес, объём' : 'Кол-во пассажиров или кг / м³'}
          />
        </div>

        {formData.transportServiceType === 'Пассажирские перевозки' ? (
          <div className="space-y-2">
            <Label htmlFor="transportDepartureDateTime">Дата и время выезда</Label>
            <Input
              id="transportDepartureDateTime"
              type="datetime-local"
              value={formData.transportDepartureDateTime || ''}
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
          options={formData.transportServiceType === 'Пассажирские перевозки'
            ? PRICE_TYPES.filter(p => p !== 'За тонну')
            : PRICE_TYPES}
          value={formData.transportPriceType}
          onChange={(v) => onInputChange('transportPriceType', v)}
        />

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
