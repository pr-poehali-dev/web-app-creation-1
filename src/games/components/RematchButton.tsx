import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { startRematch } from '../utils/gameRooms';

export default function RematchButton({ roomId }: { roomId: number }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      const newRoomId = await startRematch(roomId);
      navigate(`/games/room/${newRoomId}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось начать реванш' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      size="sm"
      disabled={busy}
      onClick={handleClick}
      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold"
    >
      <Icon name={busy ? 'Loader2' : 'RotateCcw'} size={16} className={busy ? 'mr-1.5 animate-spin' : 'mr-1.5'} />
      Реванш
    </Button>
  );
}
