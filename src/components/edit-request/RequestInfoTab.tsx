import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import type { Request } from '@/types/offer';
import { useDistrict } from '@/contexts/DistrictContext';
import { requestsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ProductMediaUpload from '@/components/ProductMediaUpload';

type PricingType = 'fixed' | 'negotiable' | 'not_set';

interface RequestInfoTabProps {
  request: Request;
  onDelete: () => void;
  onUpdate?: (updated: Request) => void;
}

export default function RequestInfoTab({ request, onDelete, onUpdate }: RequestInfoTabProps) {
  const { districts } = useDistrict();
  const { toast } = useToast();
  const districtName = districts.find(d => d.id === request.district)?.name || request.district;

  const getInitialPricingType = (): PricingType => {
    if (request.pricePerUnit > 0 && !request.negotiablePrice) return 'fixed';
    if (request.negotiablePrice) return 'negotiable';
    return 'not_set';
  };

  const isTransport = request.category === 'transport';

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [pricingType, setPricingType] = useState<PricingType>(getInitialPricingType());
  const [price, setPrice] = useState(request.pricePerUnit > 0 ? String(request.pricePerUnit) : '');
  const [negotiablePrice, setNegotiablePrice] = useState(request.negotiablePrice || false);
  const [images, setImages] = useState<string[]>(
    (request.images || []).map(img => img.url)
  );
  const [videoUrl, setVideoUrl] = useState<string>(request.video?.url || '');
  const [transportRoute, setTransportRoute] = useState(request.transportRoute || '');
  const [transportType, setTransportType] = useState(request.transportType || '');
  const [transportServiceType, setTransportServiceType] = useState(request.transportServiceType || '');
  const [transportPrice, setTransportPrice] = useState(request.transportPrice ? String(request.transportPrice) : '');
  const [transportNegotiable, setTransportNegotiable] = useState(request.transportNegotiable || false);
  const formatDateTimeLocal = (val?: string) => {
    if (!val) return '';
    try { return new Date(val).toISOString().slice(0, 16); } catch { return ''; }
  };
  const [transportDepartureDateTime, setTransportDepartureDateTime] = useState(
    formatDateTimeLocal(request.transportDepartureDateTime || request.transportDateTime)
  );

  const handlePricingTypeChange = (value: string) => {
    const pt = value as PricingType;
    setPricingType(pt);
    if (pt === 'not_set') {
      setPrice('');
      setNegotiablePrice(false);
    } else if (pt === 'negotiable') {
      setNegotiablePrice(true);
    } else {
      setNegotiablePrice(false);
    }
  };

  const handleCancel = () => {
    setTitle(request.title);
    setDescription(request.description);
    setPricingType(getInitialPricingType());
    setPrice(request.pricePerUnit > 0 ? String(request.pricePerUnit) : '');
    setNegotiablePrice(request.negotiablePrice || false);
    setImages((request.images || []).map(img => img.url));
    setVideoUrl(request.video?.url || '');
    setTransportRoute(request.transportRoute || '');
    setTransportType(request.transportType || '');
    setTransportServiceType(request.transportServiceType || '');
    setTransportPrice(request.transportPrice ? String(request.transportPrice) : '');
    setTransportNegotiable(request.transportNegotiable || false);
    setTransportDepartureDateTime(formatDateTimeLocal(request.transportDepartureDateTime || request.transportDateTime));
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const priceValue = price ? parseFloat(price) : 0;

    try {
      const updateData: Record<string, unknown> = {
        title,
        description,
        pricePerUnit: priceValue,
        negotiablePrice,
        images: images.map((url, idx) => ({ url, alt: `${title} ${idx + 1}` })),
      };

      if (isTransport) {
        updateData.transportRoute = transportRoute;
        updateData.transportType = transportType;
        updateData.transportServiceType = transportServiceType;
        updateData.transportPrice = transportPrice ? parseFloat(transportPrice) : null;
        updateData.transportNegotiable = transportNegotiable;
        updateData.transportDepartureDateTime = transportDepartureDateTime || null;
      }

      if (videoUrl) {
        updateData.video = { url: videoUrl };
      } else {
        updateData.video = null;
      }

      await requestsAPI.updateRequest(request.id, updateData);

      toast({ title: 'Сохранено', description: 'Запрос успешно обновлён' });

      if (onUpdate) {
        onUpdate({
          ...request,
          title,
          description,
          pricePerUnit: priceValue,
          negotiablePrice,
          images: images.map((url, idx) => ({ id: `img-${idx}`, url, alt: `${title} ${idx + 1}` })),
          video: videoUrl ? { id: 'vid', url: videoUrl } : undefined,
          transportRoute,
          transportType,
          transportServiceType,
          transportPrice: transportPrice ? parseFloat(transportPrice) : undefined,
          transportNegotiable,
          transportDepartureDateTime: transportDepartureDateTime || undefined,
        });
      }

      setIsEditing(false);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить изменения', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const renderPriceDisplay = () => {
    if (request.pricePerUnit > 0) {
      return (
        <>
          {request.pricePerUnit.toLocaleString()} ₽
          {request.negotiablePrice && <span className="text-muted-foreground ml-1">(Торг)</span>}
        </>
      );
    }
    if (request.negotiablePrice) return 'Ваши предложения (торг)';
    return 'Не указана';
  };

  const currentImages = (request.images || []).map(img => img.url);
  const currentVideo = request.video?.url;

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-bold">{request.title}</h2>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Icon name="Pencil" className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название запроса"
              />
            </div>

            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Опишите, что вам нужно..."
              />
            </div>

            <div className="space-y-2">
              <Label>Ценовая политика</Label>
              <Select value={pricingType} onValueChange={handlePricingTypeChange}>
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

            {pricingType === 'fixed' && (
              <div className="space-y-2">
                <Label>Цена, ₽</Label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Укажите цену"
                  min={0}
                />
                <div className="flex items-center gap-2 mt-2">
                  <Switch
                    checked={negotiablePrice}
                    onCheckedChange={setNegotiablePrice}
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
                    onChange={(e) => setTransportRoute(e.target.value)}
                    placeholder="Город отправления — Город назначения"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Тип услуги</Label>
                    <Input
                      value={transportServiceType}
                      onChange={(e) => setTransportServiceType(e.target.value)}
                      placeholder="Тип услуги"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Тип транспорта</Label>
                    <Input
                      value={transportType}
                      onChange={(e) => setTransportType(e.target.value)}
                      placeholder="Тип транспорта"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Желаемая дата и время выезда</Label>
                  <Input
                    type="datetime-local"
                    value={transportDepartureDateTime}
                    onChange={(e) => setTransportDepartureDateTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Стоимость, ₽</Label>
                  <Input
                    type="number"
                    value={transportPrice}
                    onChange={(e) => setTransportPrice(e.target.value)}
                    placeholder="Укажите стоимость"
                    min={0}
                    disabled={transportNegotiable}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={transportNegotiable}
                    onCheckedChange={(v) => { setTransportNegotiable(v); if (v) setTransportPrice(''); }}
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
                onImagesChange={setImages}
                onVideoChange={setVideoUrl}
                maxImages={5}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? (
                  <Icon name="Loader2" className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Icon name="Check" className="w-4 h-4 mr-2" />
                )}
                Сохранить
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground">{request.description}</p>

            {currentImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentImages.map((url, idx) => (
                  <img
                    key={idx}
                    src={url}
                    alt={`${request.title} ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}

            {currentVideo && (
              <video
                src={currentVideo}
                controls
                className="w-full max-h-64 rounded-lg border"
              />
            )}
          </>
        )}

        {isTransport && (request.transportRoute || request.transportServiceType || request.transportType) && (
          <div className="bg-muted/40 rounded-lg p-3 space-y-2">
            {request.transportServiceType && (
              <div className="flex items-center gap-2">
                <Icon name="Truck" className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Тип услуги</p>
                  <p className="font-medium text-sm">{request.transportServiceType}</p>
                </div>
              </div>
            )}
            {request.transportRoute && (
              <div className="flex items-center gap-2">
                <Icon name="Route" className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Маршрут</p>
                  <p className="font-medium text-sm">{request.transportRoute}</p>
                </div>
              </div>
            )}
            {request.transportType && (
              <div className="flex items-center gap-2">
                <Icon name="Car" className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Тип транспорта</p>
                  <p className="font-medium text-sm">{request.transportType}</p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="CreditCard" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Цена</p>
                <p className="font-medium">{renderPriceDisplay()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Icon name="MapPin" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Район</p>
                <p className="font-medium">{districtName}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="Calendar" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Дата создания</p>
                <p className="font-medium">
                  {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>

            {request.expiryDate && (
              <div className="flex items-center gap-2">
                <Icon name="Clock" className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Действует до</p>
                  <p className="font-medium">
                    {new Date(request.expiryDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Icon name="Eye" className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Просмотры</p>
                <p className="font-medium">{request.views || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {request.isPremium && (
          <Badge variant="default" className="bg-primary">
            <Icon name="Star" className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}

        <div className="pt-4 border-t flex gap-2">
          <Button onClick={onDelete} variant="destructive" size="sm">
            <Icon name="Trash2" className="w-4 h-4 mr-2" />
            Удалить запрос
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}