import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { ordersAPI } from '@/services/api';
import type { Order } from '@/types/order';

interface EditResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSaved: () => void;
}

export default function EditResponseModal({ isOpen, onClose, order, onSaved }: EditResponseModalProps) {
  const { toast } = useToast();
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [quantity, setQuantity] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPricePerUnit(order.pricePerUnit?.toString() || '');
      setQuantity(order.quantity?.toString() || '');
      setComment(order.buyerComment || order.comment || '');
    }
  }, [isOpen, order]);

  const handleSubmit = async () => {
    const price = parseFloat(pricePerUnit);
    const qty = parseFloat(quantity);

    if (!price || price <= 0) {
      toast({ title: 'Укажите корректную цену', variant: 'destructive' });
      return;
    }
    if (!qty || qty <= 0) {
      toast({ title: 'Укажите корректное количество', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      await ordersAPI.updateResponse(order.id, {
        editResponse: true,
        pricePerUnit: price,
        quantity: qty,
        buyerComment: comment,
      });
      toast({ title: 'Отклик обновлён' });
      onSaved();
      onClose();
    } catch {
      toast({ title: 'Ошибка при сохранении', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Pencil" className="h-5 w-5" />
            Редактировать отклик
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          {order.offerTitle}
        </div>

        <div className="space-y-4">
          <div>
            <Label>Цена за единицу (₽/{order.unit})</Label>
            <Input
              type="number"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
              min={0}
              step={0.01}
              className="mt-1"
            />
          </div>

          {!order.isRequest && (
            <div>
              <Label>Количество ({order.unit})</Label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min={0}
                step={1}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label>Комментарий</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Дополнительные пожелания..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {pricePerUnit && quantity && (
            <div className="bg-muted rounded-lg p-3 text-sm">
              <span className="text-muted-foreground">Итого: </span>
              <span className="font-bold text-primary">
                {(parseFloat(pricePerUnit) * parseFloat(quantity)).toLocaleString('ru-RU')} ₽
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
