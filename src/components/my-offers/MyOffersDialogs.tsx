import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Offer } from '@/types/offer';

type OfferStatus = 'active' | 'moderation' | 'archived';

interface MyOffer extends Offer {
  status: OfferStatus;
  views: number;
  favorites: number;
}

interface MyOffersDialogsProps {
  offerToDelete: string | null;
  onCancelDelete: () => void;
  onConfirmDelete: (offerId: string) => void;
  extendDialogOffer: MyOffer | null;
  onCloseExtendDialog: () => void;
  newExpiryDate: string;
  onExpiryDateChange: (date: string) => void;
  onConfirmExtend: () => void;
  showClearArchiveDialog: boolean;
  onCloseClearArchive: () => void;
  onConfirmClearArchive: () => void;
  archivedCount: number;
}

export default function MyOffersDialogs({
  offerToDelete,
  onCancelDelete,
  onConfirmDelete,
  extendDialogOffer,
  onCloseExtendDialog,
  newExpiryDate,
  onExpiryDateChange,
  onConfirmExtend,
  showClearArchiveDialog,
  onCloseClearArchive,
  onConfirmClearArchive,
  archivedCount,
}: MyOffersDialogsProps) {
  return (
    <>
      <AlertDialog open={!!offerToDelete} onOpenChange={onCancelDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить предложение?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Предложение будет удалено безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={() => offerToDelete && onConfirmDelete(offerToDelete)}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!extendDialogOffer} onOpenChange={onCloseExtendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Продлить публикацию</DialogTitle>
            <DialogDescription>
              Выберите новую дату окончания публикации. После подключения платёжной системы продление будет платным.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newExpiryDate">Новая дата окончания</Label>
              <Input
                id="newExpiryDate"
                type="date"
                value={newExpiryDate}
                onChange={(e) => onExpiryDateChange(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2"
              />
            </div>
            <div className="bg-muted p-3 rounded-md text-sm">
              <p className="font-medium mb-1">💡 Информация</p>
              <p className="text-muted-foreground">
                Продление публикации позволяет вашему предложению оставаться активным дольше. В будущем эта функция будет платной.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseExtendDialog}>
              Отмена
            </Button>
            <Button onClick={onConfirmExtend} disabled={!newExpiryDate}>
              Продлить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showClearArchiveDialog} onOpenChange={onCloseClearArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить архив?</AlertDialogTitle>
            <AlertDialogDescription>
              Все предложения из архива ({archivedCount} шт.) будут безвозвратно удалены. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmClearArchive} className="bg-destructive hover:bg-destructive/90">
              Удалить всё
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}