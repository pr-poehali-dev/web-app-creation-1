import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
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
  transportComment: string;
  autoMake: string;
  autoModel: string;
  autoYear: string;
  autoBodyType: string;
  autoColor: string;
  autoFuelType: string;
  autoTransmission: string;
  autoDriveType: string;
  autoMileage: string;
  autoPtsRecords: string;
  autoDescription: string;
}

interface OfferEditFormTransportProps {
  offer: Offer;
  editData: EditData;
  isSaving: boolean;
  onEditDataChange: (data: EditData) => void;
}

export default function OfferEditFormTransport({ offer, editData, isSaving, onEditDataChange }: OfferEditFormTransportProps) {
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="transportCapacity">Количество мест</Label>
        <Input
          id="transportCapacity"
          type="text"
          value={editData.transportCapacity}
          onChange={(e) => onEditDataChange({ ...editData, transportCapacity: e.target.value })}
          disabled={isSaving}
          placeholder="Например: 8 мест или 5 тонн"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="transportDateTime">Дата и время выезда</Label>
        <Input
          id="transportDateTime"
          type="datetime-local"
          value={editData.transportDateTime}
          onChange={(e) => {
            onEditDataChange({ ...editData, transportDateTime: e.target.value });
          }}
          disabled={isSaving}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="transportPriceType">Тип цены</Label>
        <div className="relative">
          <select
            id="transportPriceType"
            value={editData.transportPriceType}
            onChange={(e) => onEditDataChange({ ...editData, transportPriceType: e.target.value })}
            disabled={isSaving}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
          >
            <option value="">Выберите тип</option>
            <option value="За рейс">За рейс</option>
            <option value="За место">За место</option>
            <option value="За час">За час</option>
            <option value="За км">За км</option>
            <option value="Договорная">Договорная</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => !isSaving && onEditDataChange({ ...editData, transportNegotiable: !editData.transportNegotiable })}
          disabled={isSaving}
          className={`h-10 w-full rounded-md border-2 px-3 text-sm font-medium transition-colors ${
            editData.transportNegotiable
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-input bg-background text-foreground hover:border-primary/50'
          }`}
        >
          {editData.transportNegotiable ? '✓ Договорная цена' : 'Договорная цена'}
        </button>
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
              onChange={(e) => {
                const val = e.target.value;
                setNewWaypointAddress(val ? val.charAt(0).toUpperCase() + val.slice(1) : val);
              }}
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
      <div className="space-y-2">
        <Label htmlFor="transportComment">Комментарий</Label>
        <Textarea
          id="transportComment"
          value={editData.transportComment}
          onChange={(e) => onEditDataChange({ ...editData, transportComment: e.target.value })}
          disabled={isSaving}
          rows={2}
          placeholder="Дополнительная информация для пассажиров"
        />
      </div>
      {offer.expiryDate && (
        <p className="text-xs text-muted-foreground">
          Срок публикации до: {new Date(offer.expiryDate).toLocaleDateString('ru-RU')}
        </p>
      )}
    </div>
  );
}