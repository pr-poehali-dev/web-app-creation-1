import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import GameLayout from '../components/GameLayout';
import { getGameSession, GameUser } from '../utils/gameAuth';
import { listGameRooms, createGameRoom, joinGameRoom, GameRoomListItem, GameType } from '../utils/gameRooms';

const GAME_INFO: Record<GameType, { title: string; icon: string; description: string; color: string; available: boolean }> = {
  chess: { title: 'Шахматы', icon: 'Crown', description: 'Классическая игра для двоих', color: 'from-blue-500 to-indigo-600', available: true },
  checkers: { title: 'Шашки', icon: 'Circle', description: 'Скоро будет доступно', color: 'from-emerald-500 to-teal-600', available: false },
  poker: { title: 'Покер', icon: 'Spade', description: 'Скоро будет доступно', color: 'from-red-500 to-rose-600', available: false },
};

export default function GameLobby() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<GameUser | null>(getGameSession());
  const [selectedGame, setSelectedGame] = useState<GameType>('chess');
  const [rooms, setRooms] = useState<GameRoomListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');

  const loadRooms = useCallback(async () => {
    try {
      const data = await listGameRooms(selectedGame);
      setRooms(data);
    } catch {
      // тихо игнорируем — сервис ещё может разворачиваться
    } finally {
      setIsLoading(false);
    }
  }, [selectedGame]);

  useEffect(() => {
    if (!user) {
      navigate('/games/auth');
      return;
    }
    loadRooms();
    const interval = setInterval(loadRooms, 4000);
    return () => clearInterval(interval);
  }, [user, loadRooms, navigate]);

  const handleCreateRoom = async () => {
    try {
      const { room_id } = await createGameRoom(selectedGame);
      navigate(`/games/room/${room_id}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось создать комнату' });
    }
  };

  const handleJoinRoom = async (roomId: number) => {
    try {
      await joinGameRoom(roomId);
      navigate(`/games/room/${roomId}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось присоединиться' });
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) return;
    try {
      const { room_id } = await joinGameRoom(undefined, inviteCode.trim().toUpperCase());
      navigate(`/games/room/${room_id}`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e instanceof Error ? e.message : 'Комната не найдена' });
    }
  };

  if (!user) return null;

  return (
    <GameLayout user={user}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-1">Выберите игру</h1>
        <p className="text-slate-400">Играйте онлайн с другими игроками в реальном времени</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {(Object.keys(GAME_INFO) as GameType[]).map((type) => {
          const info = GAME_INFO[type];
          const isSelected = selectedGame === type;
          return (
            <button
              key={type}
              onClick={() => info.available && setSelectedGame(type)}
              disabled={!info.available}
              className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all border-2 ${
                isSelected ? 'border-amber-400 shadow-lg shadow-amber-500/20' : 'border-slate-800 hover:border-slate-700'
              } ${!info.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-10`} />
              <div className="relative">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${info.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <Icon name={info.icon} size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{info.title}</h3>
                <p className="text-sm text-slate-400">{info.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {GAME_INFO[selectedGame].available && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <Button
              onClick={handleCreateRoom}
              className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold"
            >
              <Icon name="Plus" size={18} className="mr-1.5" />
              Создать комнату
            </Button>
            <div className="flex gap-2 flex-1">
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Код приглашения"
                className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500 uppercase"
                maxLength={6}
              />
              <Button variant="outline" onClick={handleJoinByCode} className="border-slate-700 text-slate-200 hover:bg-slate-800">
                Войти
              </Button>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-slate-200 mb-3">Доступные комнаты</h2>

          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <Icon name="Loader2" size={32} className="mx-auto mb-2 animate-spin" />
              Загрузка комнат...
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              <Icon name="DoorOpen" size={32} className="mx-auto mb-2 opacity-50" />
              Пока нет открытых комнат. Создайте первую!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-amber-500/30 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-slate-100">{room.room_name}</p>
                    <p className="text-xs text-slate-500">
                      Создал {room.created_by_nickname} · {room.players_count}/{room.max_players} игроков
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleJoinRoom(room.id)} className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200">
                    Войти
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </GameLayout>
  );
}
