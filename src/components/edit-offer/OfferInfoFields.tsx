import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { shareContent } from '@/utils/shareUtils';
import type { Offer, TransportWaypoint } from '@/types/offer';

interface EditData {
  pricePerUnit: string;
  quantity: string;
  minOrderQuantity: string;
  description: string;
  deliveryPeriodStart: string;
  deliveryPeriodEnd: string;
  transportPrice: string;
  transportCapacity: string;
  transportDateTime: string;
  transportPriceType: string;
  transportNegotiable: boolean;
  transportWaypoints: TransportWaypoint[];
}

interface OfferInfoFieldsProps {
  offer: Offer;
  districtName: string;
  isEditing: boolean;
  isSaving: boolean;
  editData: EditData;
  onEditDataChange: (data: EditData) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEditing: () => void;
  onDelete: () => void;
}

export default function OfferInfoFields({
  offer,
  districtName,
  isEditing,
  isSaving,
  editData,
  onEditDataChange,
  onSave,
  onCancel,
  onStartEditing,
  onDelete,
}: OfferInfoFieldsProps) {
  const [newWaypointAddress, setNewWaypointAddress] = useState('');
  const [newWaypointPrice, setNewWaypointPrice] = useState('');

  const addWaypoint = () => {
    if (!newWaypointAddress.trim()) return;
    if (!newWaypointPrice || parseFloat(newWaypointPrice) <= 0) return;
    const waypoint: TransportWaypoint = {
      id: Date.now().toString(),
      address: newWaypointAddress.trim(),
      price: parseFloat(newWaypointPrice),
      isActive: true,
    };
    onEditDataChange({ ...editData, transportWaypoints: [...editData.transportWaypoints, waypoint] });
    setNewWaypointAddress('');
    setNewWaypointPrice('');
  };

  const removeWaypoint = (id: string) => {
    onEditDataChange({
      ...editData,
      transportWaypoints: editData.transportWaypoints.filter(w => w.id !== id),
    });
  };

  const toggleWaypoint = (id: string) => {
    onEditDataChange({
      ...editData,
      transportWaypoints: editData.transportWaypoints.map(w =>
        w.id === id ? { ...w, isActive: !w.isActive } : w
      ),
    });
  };

  const updateWaypointPrice = (id: string, price: string) => {
    onEditDataChange({
      ...editData,
      transportWaypoints: editData.transportWaypoints.map(w =>
        w.id === id ? { ...w, price: price ? parseFloat(price) : undefined } : w
      ),
    });
  };

  const handleShare = async () => {
    await shareContent({
      title: offer.title,
      text: `📦 ${offer.title}\n\n💰 Цена: ${offer.pricePerUnit?.toLocaleString('ru-RU')} ₽/${offer.unit}${offer.description ? `\n\n📝 ${offer.description}` : ''}`,
      url: `${window.location.origin}/offer/${offer.id}`,
      imageUrl: offer.images?.[0]?.url,

    });
  };

  const isTransport = offer.category === 'transport';

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-2xl font-bold">{offer.title}</h3>
        {!isEditing ? (
          <p className="text-muted-foreground mt-2">{offer.description}</p>
        ) : null}
      </div>

      <Separator />

      <div className="space-y-3">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={editData.description}
                onChange={(e) => onEditDataChange({ ...editData, description: e.target.value })}
                disabled={isSaving}
                rows={3}
                placeholder="Опишите ваше предложение"
              />
            </div>
            {!isTransport && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">Цена за единицу (₽)</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    value={editData.pricePerUnit}
                    onChange={(e) => onEditDataChange({ ...editData, pricePerUnit: e.target.value })}
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
                    onChange={(e) => onEditDataChange({ ...editData, quantity: e.target.value })}
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
                    onChange={(e) => onEditDataChange({ ...editData, minOrderQuantity: e.target.value })}
                    disabled={isSaving}
                    min="0"
                    placeholder="Не задано"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Период поставки</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="deliveryPeriodStart" className="text-xs text-muted-foreground">Начало</Label>
                      <Input
                        id="deliveryPeriodStart"
                        type="date"
                        value={editData.deliveryPeriodStart}
                        onChange={(e) => onEditDataChange({ ...editData, deliveryPeriodStart: e.target.value })}
                        disabled={isSaving}
                        max={editData.deliveryPeriodEnd || undefined}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="deliveryPeriodEnd" className="text-xs text-muted-foreground">Окончание</Label>
                      <Input
                        id="deliveryPeriodEnd"
                        type="date"
                        value={editData.deliveryPeriodEnd}
                        onChange={(e) => onEditDataChange({ ...editData, deliveryPeriodEnd: e.target.value })}
                        disabled={isSaving}
                        min={editData.deliveryPeriodStart || undefined}
                        max={offer.expiryDate ? new Date(offer.expiryDate).toISOString().split('T')[0] : undefined}
                      />
                    </div>
                  </div>
                  {offer.expiryDate && (
                    <p className="text-xs text-muted-foreground">
                      Срок публикации до: {new Date(offer.expiryDate).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                </div>
              </>
            )}
            {isTransport && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="transportCapacity">Количество мест</Label>
                  <Input
                    id="transportCapacity"
                    type="number"
                    value={editData.transportCapacity}
                    onChange={(e) => onEditDataChange({ ...editData, transportCapacity: e.target.value })}
                    disabled={isSaving}
                    min="1"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportDateTime">Дата и время выезда</Label>
                  <Input
                    id="transportDateTime"
                    type="datetime-local"
                    value={editData.transportDateTime}
                    onChange={(e) => onEditDataChange({ ...editData, transportDateTime: e.target.value })}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transportPriceType">Тип цены</Label>
                  <select
                    id="transportPriceType"
                    value={editData.transportPriceType}
                    onChange={(e) => onEditDataChange({ ...editData, transportPriceType: e.target.value })}
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">Выберите тип</option>
                    <option value="За рейс">За рейс</option>
                    <option value="За место">За место</option>
                    <option value="За час">За час</option>
                    <option value="За км">За км</option>
                    <option value="Договорная">Договорная</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="transportNegotiable"
                      type="checkbox"
                      checked={editData.transportNegotiable}
                      onChange={(e) => onEditDataChange({ ...editData, transportNegotiable: e.target.checked })}
                      disabled={isSaving}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="transportNegotiable">Договорная цена</Label>
                  </div>
                  {!editData.transportNegotiable && (
                    <div className="space-y-2">
                      <Label htmlFor="transportPrice">Цена за место (₽)</Label>
                      <Input
                        id="transportPrice"
                        type="number"
                        value={editData.transportPrice}
                        onChange={(e) => onEditDataChange({ ...editData, transportPrice: e.target.value })}
                        disabled={isSaving}
                        min="0"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Остановки по пути</Label>
                  <div className="bg-muted/40 rounded-md p-3 space-y-2">
                    <div className="text-xs text-muted-foreground border border-dashed border-muted-foreground/30 rounded px-2 py-1.5">
                      Основной маршрут: <span className="font-medium text-foreground">{offer.transportRoute || 'Не указан'}</span>
                    </div>
                    {editData.transportWaypoints.map((wp) => (
                      <div key={wp.id} className={`flex items-center gap-2 rounded-md p-2 border ${wp.isActive ? 'bg-background border-border' : 'bg-muted border-muted opacity-60'}`}>
                        <button
                          type="button"
                          onClick={() => toggleWaypoint(wp.id)}
                          disabled={isSaving}
                          className="shrink-0"
                          title={wp.isActive ? 'Отключить остановку' : 'Включить остановку'}
                        >
                          <Icon name={wp.isActive ? 'MapPin' : 'MapPinOff'} className={`w-4 h-4 ${wp.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{wp.address}</p>
                        </div>
                        <Input
                          type="number"
                          value={wp.price?.toString() || ''}
                          onChange={(e) => updateWaypointPrice(wp.id, e.target.value)}
                          disabled={isSaving || !wp.isActive}
                          placeholder="Цена ₽"
                          className="w-24 h-7 text-xs"
                          min="0"
                        />
                        <button
                          type="button"
                          onClick={() => removeWaypoint(wp.id)}
                          disabled={isSaving}
                          className="shrink-0 text-destructive hover:text-destructive/80"
                        >
                          <Icon name="X" className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <Input
                        value={newWaypointAddress}
                        onChange={(e) => setNewWaypointAddress(e.target.value)}
                        placeholder="Адрес остановки"
                        disabled={isSaving}
                        className="flex-1 h-8 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addWaypoint())}
                      />
                      <Input
                        type="number"
                        value={newWaypointPrice}
                        onChange={(e) => setNewWaypointPrice(e.target.value)}
                        placeholder="₽"
                        disabled={isSaving}
                        className="w-20 h-8 text-sm"
                        min="0"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addWaypoint}
                        disabled={isSaving || !newWaypointAddress.trim() || !newWaypointPrice || parseFloat(newWaypointPrice) <= 0}
                        className="h-8 px-2"
                      >
                        <Icon name="Plus" className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Укажите адрес и цену, затем нажмите <span className="font-bold">+</span> для добавления пункта посадки.</p>
                  </div>
                </div>
                {offer.expiryDate && (
                  <p className="text-xs text-muted-foreground">
                    Срок публикации до: {new Date(offer.expiryDate).toLocaleDateString('ru-RU')}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {isTransport ? (
              <>
                <div>
                  <span className="text-muted-foreground">Цена за место:</span>
                  {offer.transportNegotiable ? (
                    <p className="font-semibold">Договорная</p>
                  ) : (
                    <p className="font-bold text-lg text-primary">
                      {Number(offer.transportPrice || offer.pricePerUnit).toLocaleString('ru-RU')} ₽
                    </p>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Мест доступно:</span>
                  <p className="font-semibold">{offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0)}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Дата выезда:</span>
                  {offer.transportDateTime ? (
                    <p className="font-semibold">
                      {(() => {
                        try {
                          const d = new Date(offer.transportDateTime);
                          return isNaN(d.getTime()) ? offer.transportDateTime : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                        } catch { return offer.transportDateTime; }
                      })()}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Не указана</p>
                  )}
                </div>
              </>
            ) : (
              <>
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
                <div>
                  <span className="text-muted-foreground">Доступно:</span>
                  <p className="font-semibold text-green-600">
                    {offer.quantity - (offer.soldQuantity || 0) - (offer.reservedQuantity || 0)} {offer.unit}
                  </p>
                </div>
                {offer.minOrderQuantity && (
                  <div>
                    <span className="text-muted-foreground">Мин. заказ:</span>
                    <p className="font-semibold">{offer.minOrderQuantity} {offer.unit}</p>
                  </div>
                )}
              </>
            )}
            <div>
              <span className="text-muted-foreground">Район:</span>
              <p className="font-semibold">{districtName}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Просмотры:</span>
              <p className="font-semibold">{offer.views_count || 0}</p>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <div className="flex gap-2">
        {isEditing ? (
          <>
            <Button className="flex-1" onClick={onSave} disabled={isSaving}>
              <Icon name="Check" className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              <Icon name="X" className="w-4 h-4 mr-2" />
              Отмена
            </Button>
          </>
        ) : (
          <>
            <Button className="flex-1" onClick={onStartEditing}>
              <Icon name="Pencil" className="w-4 h-4 mr-2" />
              Редактировать
            </Button>
            <Button variant="outline" onClick={handleShare} type="button">
              <Icon name="Share2" className="w-4 h-4 mr-2" />
              Поделиться
            </Button>
            <Button
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              type="button"
            >
              <Icon name="Trash2" className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}