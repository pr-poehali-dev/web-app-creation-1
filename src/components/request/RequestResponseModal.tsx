import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface RequestResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  category: string;
  budget?: number;
}

export default function RequestResponseModal({
  isOpen,
  onClose,
  onSubmit,
  quantity,
  unit,
  pricePerUnit,
  category,
  budget
}: RequestResponseModalProps) {
  const isService = category === 'utilities';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Отправить отклик</DialogTitle>
          <DialogDescription className="text-sm">
            Заполните форму отклика, и автор запроса свяжется с вами
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          {isService ? (
            <>
              {/* Форма для услуг */}
              <div>
                <Label htmlFor="response-price" className="text-sm">
                  Стоимость услуги (₽)
                </Label>
                <Input
                  id="response-price"
                  name="response-price"
                  type="number"
                  min="1"
                  placeholder={budget ? `Бюджет заказчика: ${budget.toLocaleString('ru-RU')} ₽` : 'Укажите стоимость'}
                  required
                  className="h-9 mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Укажите полную стоимость выполнения работ
                </p>
              </div>

              <div>
                <Label htmlFor="response-delivery" className="text-sm">
                  Срок выполнения (дней)
                </Label>
                <Input
                  id="response-delivery"
                  name="response-delivery"
                  type="number"
                  min="1"
                  placeholder="Укажите срок выполнения"
                  required
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="response-comment" className="text-sm">Опыт и комментарий</Label>
                <Textarea
                  id="response-comment"
                  name="response-comment"
                  placeholder="Расскажите о вашем опыте, условиях работы и других деталях"
                  rows={3}
                  className="text-sm mt-1"
                />
              </div>
            </>
          ) : (
            <>
              {/* Форма для товаров */}
              <div>
                <Label htmlFor="response-quantity" className="text-sm">Количество ({unit})</Label>
                <Input
                  id="response-quantity"
                  name="response-quantity"
                  type="number"
                  min="1"
                  max={quantity}
                  defaultValue={quantity}
                  required
                  className="h-9 mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="response-price" className="text-sm">Ваша цена за единицу (₽)</Label>
                <Input
                  id="response-price"
                  name="response-price"
                  type="number"
                  min="1"
                  defaultValue={pricePerUnit}
                  required
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="response-delivery" className="text-sm">Срок поставки (дней)</Label>
                <Input
                  id="response-delivery"
                  name="response-delivery"
                  type="number"
                  min="1"
                  placeholder="Укажите срок поставки"
                  required
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="response-comment" className="text-sm">Комментарий</Label>
                <Textarea
                  id="response-comment"
                  name="response-comment"
                  placeholder="Дополнительная информация о вашем предложении"
                  rows={2}
                  className="text-sm mt-1"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              Отправить отклик
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
