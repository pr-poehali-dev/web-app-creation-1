import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { STATUS_MAP, isVideo } from './types';

interface DecisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber?: string;
  adminDecision: string;
  onDecisionChange: (val: string) => void;
  onSend: () => void;
  isSending: boolean;
}

export function DecisionDialog({
  open,
  onOpenChange,
  orderNumber,
  adminDecision,
  onDecisionChange,
  onSend,
  isSending,
}: DecisionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Scale" className="w-5 h-5 text-purple-600" />
            Решение арбитра по заказу №{orderNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Ваше решение будет добавлено в чат заказа и видно обеим сторонам.
          </p>
          <Textarea
            placeholder="Опишите решение арбитра..."
            value={adminDecision}
            onChange={e => onDecisionChange(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button
            onClick={onSend}
            disabled={!adminDecision.trim() || isSending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSending
              ? <Icon name="Loader2" className="w-4 h-4 animate-spin mr-2" />
              : <Icon name="Send" className="w-4 h-4 mr-2" />}
            Отправить решение
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber?: string;
  currentStatus: string;
  newStatus: string;
  onNewStatusChange: (val: string) => void;
  statusReason: string;
  onStatusReasonChange: (val: string) => void;
  onApply: () => void;
  isChanging: boolean;
}

export function StatusDialog({
  open,
  onOpenChange,
  orderNumber,
  currentStatus,
  newStatus,
  onNewStatusChange,
  statusReason,
  onStatusReasonChange,
  onApply,
  isChanging,
}: StatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="RefreshCcw" className="w-5 h-5 text-blue-600" />
            Изменить статус заказа №{orderNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Текущий статус:{' '}
              <span className={`font-semibold px-2 py-0.5 rounded text-xs ${STATUS_MAP[currentStatus]?.color}`}>
                {STATUS_MAP[currentStatus]?.label || currentStatus}
              </span>
            </p>
            <p className="text-sm font-medium">Новый статус:</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'accepted', label: 'В работе', color: 'border-green-400 text-green-700 hover:bg-green-50' },
                { value: 'completed', label: 'Завершён', color: 'border-blue-400 text-blue-700 hover:bg-blue-50' },
                { value: 'cancelled', label: 'Отменён', color: 'border-red-400 text-red-700 hover:bg-red-50' },
                { value: 'rejected', label: 'Отклонён', color: 'border-red-300 text-red-600 hover:bg-red-50' },
                { value: 'archived', label: 'В архив', color: 'border-gray-400 text-gray-600 hover:bg-gray-50' },
                { value: 'new', label: 'Новый', color: 'border-blue-300 text-blue-600 hover:bg-blue-50' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onNewStatusChange(opt.value)}
                  className={`border-2 rounded-lg px-3 py-2 text-sm font-medium transition ${opt.color} ${newStatus === opt.value ? 'ring-2 ring-offset-1 ring-current' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Причина (необязательно)</p>
            <textarea
              className="w-full border rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Укажите причину изменения статуса..."
              value={statusReason}
              onChange={e => onStatusReasonChange(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Изменение статуса будет автоматически зафиксировано в чате заказа.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Отмена</Button>
          <Button
            onClick={onApply}
            disabled={!newStatus || isChanging || newStatus === currentStatus}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isChanging
              ? <Icon name="Loader2" className="w-4 h-4 animate-spin mr-2" />
              : <Icon name="Check" className="w-4 h-4 mr-2" />}
            Применить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MediaViewerProps {
  url: string | null;
  onClose: () => void;
}

export function MediaViewer({ url, onClose }: MediaViewerProps) {
  if (!url) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition"
        onClick={onClose}
      >
        <Icon name="X" className="w-6 h-6" />
      </button>
      {isVideo(url) ? (
        <video
          src={url}
          controls
          autoPlay
          className="max-w-full max-h-[90vh] rounded-lg"
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <img
          src={url}
          alt="медиа"
          className="max-w-full max-h-[90vh] rounded-lg object-contain"
          onClick={e => e.stopPropagation()}
        />
      )}
      <a
        href={url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 right-4 text-white bg-white/20 rounded-full px-4 py-2 text-sm hover:bg-white/30 transition"
        onClick={e => e.stopPropagation()}
      >
        <Icon name="Download" className="w-4 h-4 inline mr-1" />
        Скачать
      </a>
    </div>
  );
}
