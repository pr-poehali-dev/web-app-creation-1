import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getGameSession } from '../utils/gameAuth';
import { joinGameRoom } from '../utils/gameRooms';
import GamesPWAMeta from '../components/GamesPWAMeta';

// Страница-обработчик ссылки-приглашения /games/invite/:code.
// Если пользователь не вошёл в игровой раздел — сначала отправляем на авторизацию,
// сохранив код, чтобы после входа автоматически присоединиться к комнате.
export default function GameInviteJoin() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const attempted = useRef(false);

  useEffect(() => {
    if (!code) return;
    const user = getGameSession();
    if (!user) {
      localStorage.setItem('pending_game_invite', code);
      navigate('/games/auth');
      return;
    }
    if (attempted.current) return;
    attempted.current = true;

    joinGameRoom(undefined, code.toUpperCase())
      .then(({ room_id }) => navigate(`/games/room/${room_id}`, { replace: true }))
      .catch((e) => {
        toast({ variant: 'destructive', title: 'Не удалось присоединиться', description: e instanceof Error ? e.message : 'Комната не найдена' });
        navigate('/games');
      });
  }, [code, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 flex items-center justify-center">
      <GamesPWAMeta />
      <div className="text-center text-slate-400">
        <Icon name="Loader2" size={32} className="mx-auto mb-3 animate-spin" />
        Подключаемся к комнате...
      </div>
    </div>
  );
}