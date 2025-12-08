import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from './UsersTable';

interface UserActionsDialogsProps {
  selectedUser: User | null;
  showBlockDialog: boolean;
  showDeleteDialog: boolean;
  blockDuration: number;
  onBlockDurationChange: (duration: number) => void;
  onCloseBlockDialog: () => void;
  onCloseDeleteDialog: () => void;
  onConfirmBlock: () => void;
  onConfirmDelete: () => void;
}

export default function UserActionsDialogs({
  selectedUser,
  showBlockDialog,
  showDeleteDialog,
  blockDuration,
  onBlockDurationChange,
  onCloseBlockDialog,
  onCloseDeleteDialog,
  onConfirmBlock,
  onConfirmDelete,
}: UserActionsDialogsProps) {
  return (
    <>
      <Dialog open={showBlockDialog} onOpenChange={onCloseBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заблокировать пользователя</DialogTitle>
            <DialogDescription>
              Укажите срок блокировки для {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Срок блокировки</label>
              <Select value={blockDuration.toString()} onValueChange={(val) => onBlockDurationChange(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Навсегда</SelectItem>
                  <SelectItem value="1">1 час</SelectItem>
                  <SelectItem value="3">3 часа</SelectItem>
                  <SelectItem value="6">6 часов</SelectItem>
                  <SelectItem value="12">12 часов</SelectItem>
                  <SelectItem value="24">1 день</SelectItem>
                  <SelectItem value="72">3 дня</SelectItem>
                  <SelectItem value="168">7 дней</SelectItem>
                  <SelectItem value="720">30 дней</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {blockDuration === 0 
                  ? 'Пользователь не сможет войти в систему до ручной разблокировки'
                  : `Пользователь будет заблокирован на ${blockDuration} часов`
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseBlockDialog}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={onConfirmBlock}>
              Заблокировать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={onCloseDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить пользователя?</DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить пользователя {selectedUser?.name}?
              Это действие необратимо. Все данные пользователя будут удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseDeleteDialog}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
