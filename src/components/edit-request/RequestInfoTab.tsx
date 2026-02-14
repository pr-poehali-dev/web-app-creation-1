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

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState(request.description);
  const [pricingType, setPricingType] = useState<PricingType>(getInitialPricingType());
  const [price, setPrice] = useState(request.pricePerUnit > 0 ? String(request.pricePerUnit) : '');
  const [negotiablePrice, setNegotiablePrice] = useState(request.negotiablePrice || false);

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
    setDescription(request.description);
    setPricingType(getInitialPricingType());
    setPrice(request.pricePerUnit > 0 ? String(request.pricePerUnit) : '');
    setNegotiablePrice(request.negotiablePrice || false);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const priceValue = price ? parseFloat(price) : 0;

    try {
      await requestsAPI.updateRequest(request.id, {
        description,
        pricePerUnit: priceValue,
        negotiablePrice,
      });

      toast({ title: 'Сохранено', description: 'Запрос успешно обновлён' });

      if (onUpdate) {
        onUpdate({
          ...request,
          description,
          pricePerUnit: priceValue,
          negotiablePrice,
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
          <p className="text-muted-foreground">{request.description}</p>
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
