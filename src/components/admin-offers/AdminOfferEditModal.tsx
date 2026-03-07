import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { offersAPI } from '@/services/api';
import type { AdminOffer } from './AdminOffersTable';

interface AdminOfferEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: AdminOffer | null;
  onSaved: () => void;
}

export default function AdminOfferEditModal({ isOpen, onClose, offer, onSaved }: AdminOfferEditModalProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && offer) {
      setTitle(offer.title);
      setPricePerUnit(offer.price.toString());
      setQuantity(offer.quantity.toString());
    }
  }, [isOpen, offer]);

  const handleSubmit = async () => {
    if (!offer) return;
    const price = parseFloat(pricePerUnit);
    const qty = parseInt(quantity);
    if (!title.trim()) {
      toast({ title: 'Введите название', variant: 'destructive' });
      return;
    }
    if (isNaN(price) || price < 0) {
      toast({ title: 'Некорректная цена', variant: 'destructive' });
      return;
    }
    if (isNaN(qty) || qty < 0) {
      toast({ title: 'Некорректное количество', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await offersAPI.adminEditOffer(offer.id, { title: title.trim(), pricePerUnit: price, quantity: qty });
      toast({ title: 'Сохранено', description: 'Предложение обновлено' });
      onSaved();
      onClose();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!offer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Pencil" className="h-5 w-5" />
            Редактировать предложение
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Название</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <p className="text-sm text-muted-foreground -mt-2">{offer.seller}</p>

          <div>
            <Label>Цена за единицу (₽/{offer.unit})</Label>
            <Input
              type="number"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              min={0}
              step={0.01}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Общее количество ({offer.unit})</Label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={0}
              step={1}
              className="mt-1"
            />
            {(offer.soldQuantity > 0 || offer.reservedQuantity > 0) && (
              <p className="text-xs text-muted-foreground mt-1">
                Продано: {offer.soldQuantity} {offer.unit}{offer.reservedQuantity > 0 ? `, в резерве: ${offer.reservedQuantity} ${offer.unit}` : ''}
              </p>
            )}
          </div>

          {pricePerUnit && quantity && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Итого: </span>
              <span className="font-bold text-primary">
                {(parseFloat(pricePerUnit) * parseInt(quantity)).toLocaleString('ru-RU')} ₽
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Icon name="Loader2" className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Icon name="Save" className="h-4 w-4 mr-1.5" />
            )}
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}