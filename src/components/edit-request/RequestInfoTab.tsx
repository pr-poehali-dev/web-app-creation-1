import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { Request } from '@/types/offer';
import { useDistrict } from '@/contexts/DistrictContext';
import { requestsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import RequestEditForm from './RequestEditForm';
import RequestViewContent from './RequestViewContent';
import RequestMetaInfo from './RequestMetaInfo';

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

  const formatDateTimeLocal = (val?: string) => {
    if (!val) return '';
    try { return new Date(val).toISOString().slice(0, 16); } catch { return ''; }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [quantity, setQuantity] = useState(request.quantity ? String(request.quantity) : '');
  const [unit, setUnit] = useState(request.unit || 'шт');
  const [pricingType, setPricingType] = useState<PricingType>(getInitialPricingType());
  const [price, setPrice] = useState(request.pricePerUnit > 0 ? String(request.pricePerUnit) : '');
  const [negotiablePrice, setNegotiablePrice] = useState(request.negotiablePrice || false);
  const [images, setImages] = useState<string[]>((request.images || []).map(img => img.url));
  const [videoUrl, setVideoUrl] = useState<string>(request.video?.url || '');
  const [transportRoute, setTransportRoute] = useState(request.transportRoute || '');
  const [transportType, setTransportType] = useState(request.transportType || '');
  const [transportServiceType, setTransportServiceType] = useState(request.transportServiceType || '');
  const [transportPrice, setTransportPrice] = useState(request.transportPrice ? String(request.transportPrice) : '');
  const [transportNegotiable, setTransportNegotiable] = useState(request.transportNegotiable || false);
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
    setQuantity(request.quantity ? String(request.quantity) : '');
    setUnit(request.unit || 'шт');
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
        quantity: quantity ? parseFloat(quantity) : 0,
        unit,
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
          quantity: quantity ? parseFloat(quantity) : 0,
          unit,
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
    if (isTransport) {
      if (request.transportNegotiable) return 'Ваша цена (Торг)';
      if (request.transportPrice) {
        const priceNum = Number(request.transportPrice);
        return (
          <>
            {priceNum.toLocaleString('ru-RU')} ₽
            {request.transportPriceType && (
              <span className="text-muted-foreground ml-1 text-sm">{request.transportPriceType}</span>
            )}
          </>
        );
      }
      return 'Не указана';
    }
    if (request.pricePerUnit > 0) {
      return (
        <>
          {Number(request.pricePerUnit).toLocaleString()} ₽
          {request.negotiablePrice && <span className="text-muted-foreground ml-1">(Торг)</span>}
        </>
      );
    }
    if (request.negotiablePrice) return 'Ваши предложения (торг)';
    return 'Не указана';
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="flex items-start justify-between">
          {!isTransport && <h2 className="text-2xl font-bold">{request.title}</h2>}
          {isTransport && <div />}
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Icon name="Pencil" className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
          )}
        </div>

        {isEditing ? (
          <RequestEditForm
            isTransport={isTransport}
            isSaving={isSaving}
            title={title}
            description={description}
            quantity={quantity}
            unit={unit}
            pricingType={pricingType}
            price={price}
            negotiablePrice={negotiablePrice}
            images={images}
            videoUrl={videoUrl}
            transportRoute={transportRoute}
            transportType={transportType}
            transportServiceType={transportServiceType}
            transportPrice={transportPrice}
            transportNegotiable={transportNegotiable}
            transportDepartureDateTime={transportDepartureDateTime}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onQuantityChange={setQuantity}
            onUnitChange={setUnit}
            onPricingTypeChange={handlePricingTypeChange}
            onPriceChange={setPrice}
            onNegotiablePriceChange={setNegotiablePrice}
            onImagesChange={setImages}
            onVideoChange={setVideoUrl}
            onTransportRouteChange={setTransportRoute}
            onTransportTypeChange={setTransportType}
            onTransportServiceTypeChange={setTransportServiceType}
            onTransportPriceChange={setTransportPrice}
            onTransportNegotiableChange={setTransportNegotiable}
            onTransportDepartureDateTimeChange={setTransportDepartureDateTime}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <RequestViewContent request={request} isTransport={isTransport} />
        )}

        <RequestMetaInfo
          request={request}
          districtName={districtName}
          isTransport={isTransport}
          renderPriceDisplay={renderPriceDisplay}
          onDelete={onDelete}
        />
      </CardContent>
    </Card>
  );
}
