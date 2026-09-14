import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { leaveGameRoom } from '../utils/gameRooms';

interface LeaveRoomButtonProps {
  roomId: number;
  /** Показывать без подтверждения — обычно используется после завершения партии */
  requireConfirm?: boolean;
}

// Кнопка выхода из комнаты — доступна всем участникам после завершения игры
// (пока партия идёт, backend отклонит запрос, поэтому кнопку рендерим только
// в состоянии room.status === 'finished' на стороне вызывающего компонента).
export default function LeaveRoomButton({ roomId, requireConfirm = true }: LeaveRoomButtonProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const doLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveGameRoom(roomId);
      navigate('/games');
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось покинуть комнату' });
    } finally {
      setIsLeaving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => (requireConfirm ? setConfirmOpen(true) : doLeave())}
        className="border-slate-700 text-slate-300 hover:bg-slate-800"
      >
        <Icon name="LogOut" size={16} className="mr-1.5" />
        Выйти из комнаты
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        title="Покинуть комнату?"
        description="Вы выйдете из этой игровой комнаты."
        confirmLabel={isLeaving ? 'Выход...' : 'Выйти'}
        cancelLabel="Отмена"
        confirmClassName="bg-slate-700 hover:bg-slate-600 text-white"
        onConfirm={doLeave}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
