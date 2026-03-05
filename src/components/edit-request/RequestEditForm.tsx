import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import ProductMediaUpload from '@/components/ProductMediaUpload';

type PricingType = 'fixed' | 'negotiable' | 'not_set';

interface RequestEditFormProps {
  isTransport: boolean;
  isSaving: boolean;
  title: string;
  description: string;
  quantity: string;
  unit: string;
  pricingType: PricingType;
  price: string;
  negotiablePrice: boolean;
  images: string[];
  videoUrl: string;
  transportRoute: string;
  transportType: string;
  transportServiceType: string;
  transportPrice: string;
  transportNegotiable: boolean;
  transportDepartureDateTime: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onUnitChange: (v: string) => void;
  onPricingTypeChange: (v: string) => void;
  onPriceChange: (v: string) => void;
  onNegotiablePriceChange: (v: boolean) => void;
  onImagesChange: (v: string[]) => void;
  onVideoChange: (v: string) => void;
  onTransportRouteChange: (v: string) => void;
  onTransportTypeChange: (v: string) => void;
  onTransportServiceTypeChange: (v: string) => void;
  onTransportPriceChange: (v: string) => void;
  onTransportNegotiableChange: (v: boolean) => void;
  onTransportDepartureDateTimeChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function RequestEditForm({
  isTransport,
  isSaving,
  title,
  description,
  quantity,
  unit,
  pricingType,
  price,
  negotiablePrice,
  images,
  videoUrl,
  transportRoute,
  transportType,
  transportServiceType,
  transportPrice,
  transportNegotiable,
  transportDepartureDateTime,
  onTitleChange,
  onDescriptionChange,
  onQuantityChange,
  onUnitChange,
  onPricingTypeChange,
  onPriceChange,
  onNegotiablePriceChange,
  onImagesChange,
  onVideoChange,
  onTransportRouteChange,
  onTransportTypeChange,
  onTransportServiceTypeChange,
  onTransportPriceChange,
  onTransportNegotiableChange,
  onTransportDepartureDateTimeChange,
  onSave,
  onCancel,
}: RequestEditFormProps) {
  return (
    <div className="space-y-5">
      {!isTransport && (
        <div className="space-y-2">
          <Label>Название</Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Название запроса"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Описание</Label>
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          placeholder="Опишите, что вам нужно..."
        />
      </div>

      {!isTransport && (
        <div className="space-y-2">
          <Label>Количество</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              placeholder="Количество"
              min={1}
              className="flex-1"
            />
            <Select value={unit} onValueChange={onUnitChange}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="шт">шт</SelectItem>
                <SelectItem value="кг">кг</SelectItem>
                <SelectItem value="т">т</SelectItem>
                <SelectItem value="л">л</SelectItem>
                <SelectItem value="м">м</SelectItem>
                <SelectItem value="м²">м²</SelectItem>
                <SelectItem value="м³">м³</SelectItem>
                <SelectItem value="уп">уп</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {!isTransport && (
        <div className="space-y-2">
          <Label>Ценовая политика</Label>
          <Select value={pricingType} onValueChange={onPricingTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип цены" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Фиксированная цена</SelectItem>
              <SelectItem value="negotiable">Ваши предложения (торг)</SelectItem>
              <SelectItem value="not_set">Не указана</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {!isTransport && pricingType === 'fixed' && (
        <div className="space-y-2">
          <Label>Цена, ₽</Label>
          <Input
            type="number"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            placeholder="Укажите цену"
            min={0}
          />
          <div className="flex items-center gap-2 mt-2">
            <Switch
              checked={negotiablePrice}
              onCheckedChange={onNegotiablePriceChange}
              id="negotiable-switch"
            />
            <Label htmlFor="negotiable-switch" className="cursor-pointer text-sm">
              Возможен торг
            </Label>
          </div>
        </div>
      )}

      {isTransport && (
        <div className="space-y-3 border-t pt-4">
          <Label className="text-sm font-semibold">Транспортные данные</Label>
          <div className="space-y-2">
            <Label>Маршрут</Label>
            <Input
              value={transportRoute}
              onChange={(e) => onTransportRouteChange(e.target.value)}
              placeholder="Город отправления — Город назначения"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Тип услуги</Label>
              <Input
                value={transportServiceType}
                onChange={(e) => onTransportServiceTypeChange(e.target.value)}
                placeholder="Тип услуги"
              />
            </div>
            <div className="space-y-2">
              <Label>Тип транспорта</Label>
              <Input
                value={transportType}
                onChange={(e) => onTransportTypeChange(e.target.value)}
                placeholder="Тип транспорта"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Желаемая дата и время выезда</Label>
            <Input
              type="datetime-local"
              value={transportDepartureDateTime}
              onChange={(e) => onTransportDepartureDateTimeChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Стоимость, ₽</Label>
            <Input
              type="number"
              value={transportPrice}
              onChange={(e) => onTransportPriceChange(e.target.value)}
              placeholder="Укажите стоимость"
              min={0}
              disabled={transportNegotiable}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={transportNegotiable}
              onCheckedChange={(v) => { onTransportNegotiableChange(v); if (v) onTransportPriceChange(''); }}
              id="transport-negotiable"
            />
            <Label htmlFor="transport-negotiable" className="cursor-pointer text-sm">
              По договоренности
            </Label>
          </div>
        </div>
      )}

      <div className="border-t pt-4">
        <ProductMediaUpload
          productImages={images}
          productVideoUrl={videoUrl || undefined}
          onImagesChange={onImagesChange}
          onVideoChange={onVideoChange}
          maxImages={5}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button onClick={onSave} disabled={isSaving} size="sm">
          {isSaving ? (
            <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Icon name="Check" className="w-4 h-4 mr-2" />
          )}
          Сохранить
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
          Отмена
        </Button>
      </div>
    </div>
  );
}
