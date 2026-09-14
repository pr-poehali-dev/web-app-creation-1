import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import GameLayout from '../components/GameLayout';
import { getGameSession } from '../utils/gameAuth';
import { getGameRoom, GameType } from '../utils/gameRooms';
import ChessGame from './ChessGame';
import CheckersGame from './CheckersGame';
import PokerGame from './PokerGame';

// Комната может быть шахматной, шашечной или покерной — сначала узнаём тип игры,
// затем рендерим нужную доску. Дочерние компоненты сами читают :roomId через useParams.
export default function GameRoomRouter() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = getGameSession();
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/games/auth');
      return;
    }
    let cancelled = false;
    getGameRoom(Number(roomId))
      .then((room) => {
        if (!cancelled) setGameType(room.game_type);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, user, navigate]);

  if (!user) return null;

  if (notFound) {
    return (
      <GameLayout user={user}>
        <div className="text-center py-20 text-slate-500">
          <Icon name="AlertCircle" size={32} className="mx-auto mb-2" />
          Комната не найдена
        </div>
      </GameLayout>
    );
  }

  if (!gameType) {
    return (
      <GameLayout user={user}>
        <div className="text-center py-20 text-slate-500">
          <Icon name="Loader2" size={32} className="mx-auto mb-2 animate-spin" />
          Загрузка партии...
        </div>
      </GameLayout>
    );
  }

  if (gameType === 'checkers') return <CheckersGame />;
  if (gameType === 'poker') return <PokerGame />;
  return <ChessGame />;
}