import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { Offer } from '@/types/offer';
import { offersAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface OfferInfoTabProps {
  offer: Offer;
  districtName: string;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export default function OfferInfoTab({ offer, districtName, onEdit, onDelete, onUpdate }: OfferInfoTabProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    pricePerUnit: offer.pricePerUnit.toString(),
    quantity: offer.quantity.toString(),
    minOrderQuantity: offer.minOrderQuantity?.toString() || '',
  });

  const handleSave = async () => {
    const pricePerUnit = parseFloat(editData.pricePerUnit);
    const quantity = parseInt(editData.quantity);
    const minOrderQuantity = editData.minOrderQuantity ? parseInt(editData.minOrderQuantity) : undefined;

    if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Укажите корректную цену',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Укажите корректное количество',
        variant: 'destructive',
      });
      return;
    }

    if (minOrderQuantity && (isNaN(minOrderQuantity) || minOrderQuantity <= 0 || minOrderQuantity > quantity)) {
      toast({
        title: 'Ошибка',
        description: 'Минимальное количество должно быть больше 0 и не превышать общее количество',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await offersAPI.updateOffer(offer.id, {
        pricePerUnit,
        quantity,
        minOrderQuantity,
      });
      
      // Очищаем кэш предложений, чтобы на главной отобразились новые данные
      localStorage.removeItem('cached_offers');
      
      // Триггерим обновление списка на главной странице
      console.log('📤 Отправляю событие offers-updated');
      window.dispatchEvent(new Event('offers-updated'));
      
      toast({
        title: 'Успешно',
        description: 'Объявление обновлено',
      });
      
      setIsEditing(false);
      
      // Обновляем локальные данные после небольшой задержки
      setTimeout(() => {
        onUpdate();
      }, 100);
    } catch (error) {
      console.error('Error updating offer:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить объявление',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      pricePerUnit: offer.pricePerUnit.toString(),
      quantity: offer.quantity.toString(),
      minOrderQuantity: offer.minOrderQuantity?.toString() || '',
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Основная информация</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offer.images && offer.images.length > 0 && (
            <div className="aspect-video rounded-lg overflow-hidden">
              <img
                src={offer.images[0].url}
                alt={offer.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="space-y-3">
            <div>
              <h3 className="text-2xl font-bold">{offer.title}</h3>
              <p className="text-muted-foreground mt-2">{offer.description}</p>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricePerUnit">Цена за единицу (₽)</Label>
                    <Input
                      id="pricePerUnit"
                      type="number"
                      value={editData.pricePerUnit}
                      onChange={(e) => setEditData({ ...editData, pricePerUnit: e.target.value })}
                      disabled={isSaving}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Доступное количество ({offer.unit})</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={editData.quantity}
                      onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                      disabled={isSaving}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minOrderQuantity">Минимальное количество для заказа ({offer.unit})</Label>
                    <Input
                      id="minOrderQuantity"
                      type="number"
                      value={editData.minOrderQuantity}
                      onChange={(e) => setEditData({ ...editData, minOrderQuantity: e.target.value })}
                      disabled={isSaving}
                      min="0"
                      placeholder="Не задано"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Цена за единицу:</span>
                    <p className="font-bold text-lg text-primary">
                      {offer.pricePerUnit.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Количество:</span>
                    <p className="font-semibold">{offer.quantity} {offer.unit}</p>
                  </div>
                  {offer.minOrderQuantity && (
                    <div>
                      <span className="text-muted-foreground">Мин. заказ:</span>
                      <p className="font-semibold">{offer.minOrderQuantity} {offer.unit}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Район:</span>
                    <p className="font-semibold">{districtName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Просмотры:</span>
                    <p className="font-semibold">{offer.views || 0}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                    <Icon name="Check" className="w-4 h-4 mr-2" />
                    Сохранить
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                    <Icon name="X" className="w-4 h-4 mr-2" />
                    Отмена
                  </Button>
                </>
              ) : (
                <>
                  <Button className="flex-1" onClick={() => setIsEditing(true)}>
                    <Icon name="Pencil" className="w-4 h-4 mr-2" />
                    Редактировать
                  </Button>
                  <Button variant="destructive" onClick={onDelete}>
                    <Icon name="Trash2" className="w-4 h-4 mr-2" />
                    Удалить
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}