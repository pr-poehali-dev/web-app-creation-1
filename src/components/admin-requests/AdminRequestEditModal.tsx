import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { requestsAPI } from '@/services/api';
import type { AdminRequest } from './AdminRequestsTable';

interface AdminRequestEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AdminRequest | null;
  onSaved: () => void;
}

function toDatetimeLocal(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function toDateInput(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return '';
  }
}

export default function AdminRequestEditModal({ isOpen, onClose, request, onSaved }: AdminRequestEditModalProps) {
  const [expiryDate, setExpiryDate] = useState('');
  const [transportDepartureDateTime, setTransportDepartureDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isTransport = !!request?.transportServiceType;

  useEffect(() => {
    if (isOpen && request) {
      setExpiryDate(toDateInput(request.expiryDate));
      setTransportDepartureDateTime(toDatetimeLocal(request.transportDepartureDateTime));
    }
  }, [isOpen, request]);

  const handleSubmit = async () => {
    if (!request) return;
    setIsSubmitting(true);
    try {
      const updateData: { expiryDate?: string | null; transportDepartureDateTime?: string | null } = {
        expiryDate: expiryDate || null,
      };
      if (isTransport) {
        updateData.transportDepartureDateTime = transportDepartureDateTime || null;
      }
      await requestsAPI.adminEditRequest(request.id, updateData);
      toast.success('Запрос обновлён');
      onSaved();
      onClose();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Calendar" className="h-5 w-5" />
            Сроки публикации
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 mb-2">
          <p className="font-medium text-sm">{request.title}</p>
          <p className="text-xs text-muted-foreground">{request.buyer}</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Дата окончания публикации</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Оставьте пустым — без ограничений</p>
          </div>

          {isTransport && (
            <div>
              <Label>Дата и время отправления</Label>
              <Input
                type="datetime-local"
                value={transportDepartureDateTime}
                onChange={(e) => setTransportDepartureDateTime(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">После истечения карточка будет скрыта</p>
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
