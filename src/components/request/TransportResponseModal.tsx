import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { ExistingResponse } from '@/pages/RequestDetail/useRequestResponse';

interface TransportRequest {
  transportRoute?: string;
  transportDateTime?: string;
  transportCapacity?: string;
  transportPrice?: string;
  transportPriceType?: string;
  transportNegotiable?: boolean;
  quantity?: number;
}

interface TransportResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TransportResponseData) => void;
  request: TransportRequest;
  existingResponse?: ExistingResponse | null;
}

export interface TransportResponseData {
  offeredPrice: number;
  departureTime: string;
  seatsCount: number;
  comment: string;
}

function formatNumber(value: string): string {
  const numbers = value.replace(/\D/g, '');
  return numbers.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
}

export default function TransportResponseModal({
  isOpen,
  onClose,
  onSubmit,
  request,
  existingResponse,
}: TransportResponseModalProps) {
  const isEditMode = !!existingResponse;
  const [priceValue, setPriceValue] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [seatsCount, setSeatsCount] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (existingResponse) {
      const parsed = parseExistingComment(existingResponse.buyerComment || '');
      setPriceValue(existingResponse.pricePerUnit ? formatNumber(String(existingResponse.pricePerUnit)) : '');
      setDepartureTime(parsed.departureTime || '');
      setSeatsCount(String(existingResponse.quantity || request.quantity || 1));
      setComment(parsed.comment || '');
    } else {
      const defaultPrice = request.transportNegotiable ? '' : (request.transportPrice || '');
      setPriceValue(defaultPrice ? formatNumber(defaultPrice) : '');
      setDepartureTime(request.transportDateTime ? toLocalDateTimeInput(request.transportDateTime) : '');
      setSeatsCount(String(request.quantity || 1));
      setComment('');
    }
  }, [isOpen, existingResponse]);

  function toLocalDateTimeInput(isoString: string): string {
    try {
      const d = new Date(isoString);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  }

  function parseExistingComment(text: string): { departureTime: string; comment: string } {
    const match = text.match(/Время выезда: (.+?)\.\s*(.*)/s);
    if (match) return { departureTime: match[1], comment: match[2].trim() };
    return { departureTime: '', comment: text };
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(priceValue.replace(/\s/g, ''));
    onSubmit({
      offeredPrice: isNaN(price) ? 0 : price,
      departureTime,
      seatsCount: parseInt(seatsCount) || (request.quantity || 1),
      comment,
    });
  };

  const requestedSeats = request.quantity || 1;
  const requestedRoute = request.transportRoute || '';
  const requestedPrice = request.transportNegotiable
    ? null
    : request.transportPrice
    ? Number(request.transportPrice)
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            {isEditMode ? 'Редактировать предложение' : 'Предложить перевозку'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditMode ? 'Измените данные вашего предложения' : 'Заполните детали перевозки'}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm mb-1">
          <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">Запрос заказчика</p>
          {requestedRoute && (
            <div className="flex items-center gap-2">
              <Icon name="ArrowRightLeft" className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="font-medium">{requestedRoute}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Icon name="Users" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span>{requestedSeats} мест</span>
          </div>
          {requestedPrice !== null ? (
            <div className="flex items-center gap-2">
              <Icon name="Banknote" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{requestedPrice.toLocaleString('ru-RU')} ₽
                {request.transportPriceType && (
                  <span className="text-muted-foreground ml-1">{request.transportPriceType}</span>
                )}
              </span>
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs">Договорная цена</Badge>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Icon name="ArrowRightLeft" className="h-3.5 w-3.5 text-muted-foreground" />
              Маршрут
            </Label>
            <Input
              value={requestedRoute}
              disabled
              className="bg-muted text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Icon name="Users" className="h-3.5 w-3.5 text-muted-foreground" />
              Количество мест
            </Label>
            <Input
              type="number"
              min={1}
              value={seatsCount}
              disabled
              className="bg-muted text-sm"
            />
            <p className="text-xs text-muted-foreground">Количество мест соответствует запросу</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transport-price" className="text-sm font-medium flex items-center gap-1">
              <Icon name="Banknote" className="h-3.5 w-3.5 text-muted-foreground" />
              Ваша цена за поездку (₽) *
            </Label>
            <Input
              id="transport-price"
              value={priceValue}
              onChange={(e) => setPriceValue(formatNumber(e.target.value))}
              placeholder="Введите вашу цену..."
              required
              className="text-sm"
            />
            {requestedPrice !== null && (
              <p className="text-xs text-muted-foreground">
                Запрошенная цена: {requestedPrice.toLocaleString('ru-RU')} ₽
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transport-departure" className="text-sm font-medium flex items-center gap-1">
              <Icon name="Clock" className="h-3.5 w-3.5 text-muted-foreground" />
              Время выезда *
            </Label>
            <Input
              id="transport-departure"
              type="datetime-local"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transport-comment" className="text-sm font-medium flex items-center gap-1">
              <Icon name="MessageSquare" className="h-3.5 w-3.5 text-muted-foreground" />
              Комментарий
            </Label>
            <Textarea
              id="transport-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Тип транспорта, дополнительные условия..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Отменить
            </Button>
            <Button type="submit" className="flex-1">
              <Icon name="Send" className="mr-1.5 h-4 w-4" />
              {isEditMode ? 'Сохранить' : 'Отправить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
