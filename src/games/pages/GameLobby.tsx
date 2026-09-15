import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import GameLayout from '../components/GameLayout';
import { getGameSession, GameUser } from '../utils/gameAuth';
import { listGameRooms, createGameRoom, joinGameRoom, deleteGameRoom, GameRoomListItem, GameType } from '../utils/gameRooms';

const GAME_INFO: Record<GameType, { title: string; icon: string; description: string; color: string; available: boolean }> = {
  chess: { title: 'Шахматы', icon: 'Crown', description: 'Классическая игра для двоих', color: 'from-blue-500 to-indigo-600', available: true },
  checkers: { title: 'Шашки', icon: 'Circle', description: 'Классическая игра для двоих', color: 'from-emerald-500 to-teal-600', available: true },
  poker: { title: 'Покер', icon: 'Spade', description: 'Техасский холдем до 8 игроков', color: 'from-red-500 to-rose-600', available: true },
};

export default function GameLobby() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<GameUser | null>(getGameSession());
  const [selectedGame, setSelectedGame] = useState<GameType>('chess');
  const [rooms, setRooms] = useState<GameRoomListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState('');
  const [copiedRoomId, setCopiedRoomId] = useState<number | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<GameRoomListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clubLinkCopied, setClubLinkCopied] = useState(false);

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

  const handleShareRoom = async (room: GameRoomListItem) => {
    if (!room.invite_code) return;
    const inviteUrl = `${window.location.origin}/games/invite/${room.invite_code}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Присоединяйся к игре', text: 'Приглашаю тебя в партию!', url: inviteUrl });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedRoomId(room.id);
      toast({ title: 'Ссылка скопирована' });
      setTimeout(() => setCopiedRoomId(null), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось скопировать ссылку' });
    }
  };

  const handleShareClub = async () => {
    const clubUrl = `${window.location.origin}/games`;
    const prettyText = `игровой-клуб.рф — заходи, там шахматы, шашки и покер онлайн!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Игровой клуб', text: prettyText, url: clubUrl });
        return;
      } catch {
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(clubUrl);
      setClubLinkCopied(true);
      toast({ title: 'Ссылка на клуб скопирована' });
      setTimeout(() => setClubLinkCopied(false), 2000);
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось скопировать ссылку' });
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      await deleteGameRoom(roomToDelete.id);
      toast({ title: 'Комната удалена' });
      setRoomToDelete(null);
      loadRooms();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось удалить комнату' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <GameLayout user={user}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-1">Выберите игру</h1>
          <p className="text-slate-400">Играйте онлайн с другими игроками в реальном времени</p>
        </div>
      </div>

      <div className="mb-8 bg-gradient-to-r from-amber-500/10 to-purple-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
            <Icon name="Spade" size={20} className="text-slate-950" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-100">Позови друзей в игровой клуб</p>
            <p className="text-xs text-slate-400 truncate">игровой-клуб.рф — общая ссылка на выбор игры и все комнаты</p>
          </div>
        </div>
        <Button
          onClick={handleShareClub}
          size="sm"
          className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold shrink-0"
        >
          <Icon name={clubLinkCopied ? 'Check' : 'Share2'} size={16} className="mr-1.5" />
          Поделиться клубом
        </Button>
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
              {rooms.map((room) => {
                const isOwner = room.created_by === user.id;
                return (
                  <div
                    key={room.id}
                    className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-amber-500/30 transition-colors gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Icon name={GAME_INFO[room.game_type].icon} size={14} className="text-amber-400 shrink-0" />
                        <span className="text-xs font-medium text-amber-400">{GAME_INFO[room.game_type].title}</span>
                      </div>
                      <p className="font-semibold text-slate-100 truncate">{room.room_name}</p>
                      <p className="text-xs text-slate-500">
                        Создал {room.created_by_nickname} · {room.players_count}/{room.max_players} игроков
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOwner && room.invite_code && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleShareRoom(room)}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800 h-9 w-9"
                          title="Поделиться приглашением"
                        >
                          <Icon name={copiedRoomId === room.id ? 'Check' : 'Share2'} size={16} />
                        </Button>
                      )}
                      {isOwner && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setRoomToDelete(room)}
                          className="border-slate-700 text-red-400 hover:bg-red-500/10 hover:text-red-400 h-9 w-9"
                          title="Удалить комнату"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      )}
                      <Button size="sm" onClick={() => handleJoinRoom(room.id)} className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200">
                        Войти
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={!!roomToDelete}
        title="Удалить комнату?"
        description={roomToDelete ? `Комната «${roomToDelete.room_name}» будет удалена без возможности восстановления.` : undefined}
        confirmLabel={isDeleting ? 'Удаление...' : 'Удалить'}
        cancelLabel="Отмена"
        onConfirm={handleDeleteRoom}
        onCancel={() => setRoomToDelete(null)}
      />
    </GameLayout>
  );
}