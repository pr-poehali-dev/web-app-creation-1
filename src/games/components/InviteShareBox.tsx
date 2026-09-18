import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { GameRoomDetail } from '../utils/gameRooms';
import { GameUser } from '../utils/gameAuth';

interface InviteShareBoxProps {
  room: GameRoomDetail;
  user: GameUser;
}

// Ссылка-приглашение видна ВСЕМ игрокам комнаты (не только создателю), пока комната
// ждёт остальных участников — это удобно и для дуэльных игр, и для покера на 8 мест.
export default function InviteShareBox({ room, user }: InviteShareBoxProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const isMember = room.players.some((p) => p.user_id === user.id);
  if (!isMember || room.status !== 'waiting' || !room.invite_code) return null;

  const inviteUrl = `${window.location.origin}/games/invite/${room.invite_code}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Присоединяйся к игре', text: 'Приглашаю тебя в партию!', url: inviteUrl });
        return;
      } catch {
        // пользователь закрыл диалог — просто fallback на копирование ниже не нужен
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({ title: 'Ссылка скопирована' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось скопировать ссылку' });
    }
  };

  return (
    <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
      <div>
        <p className="text-sm font-semibold text-amber-300 flex items-center gap-1.5">
          <Icon name="Link" size={16} />
          Пригласите соперника
        </p>
        <p className="text-xs text-slate-400 mt-0.5 break-all">{inviteUrl}</p>
      </div>
      <Button
        onClick={handleShare}
        size="sm"
        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shrink-0"
      >
        <Icon name={copied ? 'Check' : 'Share2'} size={16} className="mr-1.5" />
        Поделиться
      </Button>
    </div>
  );
}
