import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import GameLayout from '../components/GameLayout';
import InviteShareBox from '../components/InviteShareBox';
import LeaveRoomButton from '../components/LeaveRoomButton';
import { getGameSession, GameUser } from '../utils/gameAuth';
import { getGameRoom, GameRoomDetail, startPokerTable } from '../utils/gameRooms';
import { sendPokerAction, PokerState } from '../utils/gamePoker';
import { getChatMessages, sendChatMessage, ChatMessage } from '../utils/gameChat';

const SUIT_SYMBOLS: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const RANK_LABELS: Record<string, string> = { T: '10' };

function PlayingCard({ card, hidden, size = 'md' }: { card?: string; hidden?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-11 text-xs',
    md: 'w-12 h-16 text-base',
    lg: 'w-14 h-20 text-lg',
  };
  if (hidden || !card) {
    return (
      <div className={`${sizes[size]} rounded-md bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-400/40 shadow-md flex items-center justify-center`}>
        <Icon name="Spade" size={size === 'sm' ? 12 : 16} className="text-indigo-300/50" />
      </div>
    );
  }
  const rank = card[0];
  const suit = card[1];
  const isRed = suit === 'H' || suit === 'D';
  return (
    <div className={`${sizes[size]} rounded-md bg-white border border-slate-300 shadow-md flex flex-col items-center justify-center font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
      <span>{RANK_LABELS[rank] || rank}</span>
      <span className="text-[0.9em] leading-none">{SUIT_SYMBOLS[suit]}</span>
    </div>
  );
}

const STAGE_LABELS: Record<string, string> = {
  waiting: 'Ожидание раздачи',
  preflop: 'Префлоп',
  flop: 'Флоп',
  turn: 'Тёрн',
  river: 'Ривер',
  showdown: 'Вскрытие карт',
};

export default function PokerGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user] = useState<GameUser | null>(getGameSession());
  const [room, setRoom] = useState<GameRoomDetail | null>(null);
  const [raiseAmount, setRaiseAmount] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isActing, setIsActing] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const numericRoomId = Number(roomId);

  const loadRoom = useCallback(async () => {
    try {
      const data = await getGameRoom(numericRoomId);
      setRoom(data);
    } catch {
      // комната может быть временно недоступна при развороте бэкенда
    }
  }, [numericRoomId]);

  const loadChat = useCallback(async () => {
    try {
      const messages = await getChatMessages(numericRoomId);
      setChatMessages(messages);
    } catch {
      // ignore
    }
  }, [numericRoomId]);

  useEffect(() => {
    if (!user) {
      navigate('/games/auth');
      return;
    }
    loadRoom();
    loadChat();
    const roomInterval = setInterval(loadRoom, 2000);
    const chatInterval = setInterval(loadChat, 3000);
    return () => {
      clearInterval(roomInterval);
      clearInterval(chatInterval);
    };
  }, [user, loadRoom, loadChat, navigate]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [chatMessages]);

  if (!user) return null;

  const pokerState = room?.state as unknown as PokerState | undefined;
  const isMyTurn = room?.current_turn_user_id === user.id;
  const myPlayerRow = room?.players.find((p) => p.user_id === user.id);
  const myPokerState = pokerState?.players?.[String(user.id)];
  const stage = pokerState?.stage || 'waiting';
  const canStartHand = room?.status === 'playing' && (stage === 'waiting' || stage === 'showdown');
  const myChips = myPlayerRow?.chips ?? 0;
  const toCall = pokerState ? pokerState.current_bet - (myPokerState?.bet_this_round || 0) : 0;

  const handleAction = async (action: 'start_hand' | 'fold' | 'check' | 'call' | 'raise', amount?: number) => {
    setIsActing(true);
    try {
      const result = await sendPokerAction(numericRoomId, action, amount);
      if (!result.success) {
        toast({ variant: 'destructive', title: 'Недопустимое действие', description: result.error });
        return;
      }
      await loadRoom();
      setRaiseAmount('');
    } finally {
      setIsActing(false);
    }
  };

  const handleRaise = () => {
    const amount = parseInt(raiseAmount, 10);
    if (!amount || amount <= (pokerState?.current_bet || 0)) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Укажите сумму рейза больше текущей ставки' });
      return;
    }
    handleAction('raise', amount);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    try {
      await sendChatMessage(numericRoomId, chatInput.trim());
      setChatInput('');
      loadChat();
    } catch {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось отправить сообщение' });
    }
  };

  const handleStartTable = async () => {
    setIsActing(true);
    try {
      await startPokerTable(numericRoomId);
      await loadRoom();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: e instanceof Error ? e.message : 'Не удалось начать игру' });
    } finally {
      setIsActing(false);
    }
  };

  const seats = room?.players || [];
  const isOwner = room?.created_by === user.id;

  return (
    <GameLayout user={user}>
      <button
        onClick={() => navigate('/games')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад в лобби
      </button>

      {room && <InviteShareBox room={room} user={user} />}

      {!room ? (
        <div className="text-center py-20 text-slate-500">
          <Icon name="Loader2" size={32} className="mx-auto mb-2 animate-spin" />
          Загрузка партии...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <div className="flex items-center justify-between mb-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Icon name="Spade" size={20} className="text-red-400" />
                <span className="font-semibold text-slate-100">{STAGE_LABELS[stage]}</span>
                {pokerState && pokerState.pot > 0 && (
                  <span className="text-sm text-amber-400 flex items-center gap-1">
                    <Icon name="Coins" size={14} /> Банк: {pokerState.pot}
                  </span>
                )}
              </div>
              {room.status === 'waiting' && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-800 text-slate-400">
                    Ожидание игроков ({seats.length}/{room.max_players})
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      onClick={handleStartTable}
                      disabled={isActing || seats.length < 2}
                      className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold"
                    >
                      <Icon name="Play" size={14} className="mr-1" />
                      Начать игру
                    </Button>
                  )}
                </div>
              )}
              {room.status === 'finished' && (
                <LeaveRoomButton roomId={numericRoomId} />
              )}
            </div>

            <div className="relative bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl border-4 border-amber-700/40 shadow-2xl p-6 min-h-[320px]">
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {seats.map((p) => {
                  const pState = pokerState?.players?.[String(p.user_id)];
                  const isTurn = room.current_turn_user_id === p.user_id;
                  return (
                    <div
                      key={p.user_id}
                      className={`rounded-xl p-2.5 min-w-[110px] text-center border-2 ${
                        isTurn ? 'border-amber-400 bg-amber-500/10' : 'border-slate-700/60 bg-slate-900/50'
                      } ${pState?.folded ? 'opacity-40' : ''}`}
                    >
                      <div className="text-xl">{p.avatar_emoji}</div>
                      <p className="text-xs font-semibold text-slate-100 truncate max-w-[90px] mx-auto">{p.nickname}</p>
                      <p className="text-xs text-amber-400">{p.chips ?? 0} фишек</p>
                      {pState?.bet_this_round ? (
                        <p className="text-[10px] text-emerald-400">Ставка: {pState.bet_this_round}</p>
                      ) : null}
                      {pState?.folded && <p className="text-[10px] text-red-400">Фолд</p>}
                      {pState?.all_in && <p className="text-[10px] text-purple-400">Ва-банк</p>}
                      <div className="flex justify-center gap-1 mt-1.5">
                        <PlayingCard
                          card={p.user_id === user.id ? pState?.hole_cards?.[0] : undefined}
                          hidden={p.user_id !== user.id && stage !== 'showdown'}
                          size="sm"
                        />
                        <PlayingCard
                          card={p.user_id === user.id ? pState?.hole_cards?.[1] : (stage === 'showdown' ? pokerState?.last_result?.hole_cards?.[String(p.user_id)]?.[1] : undefined)}
                          hidden={p.user_id !== user.id && stage !== 'showdown'}
                          size="sm"
                        />
                      </div>
                      {stage === 'showdown' && pokerState?.last_result?.hands?.[String(p.user_id)] && (
                        <p className="text-[10px] text-amber-300 mt-1">{pokerState.last_result.hands[String(p.user_id)]}</p>
                      )}
                      {stage === 'showdown' && pokerState?.last_result?.winnings?.[String(p.user_id)] && (
                        <p className="text-[10px] text-emerald-400 font-bold">+{pokerState.last_result.winnings[String(p.user_id)]}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center gap-2 mb-2">
                {(pokerState?.community_cards || []).map((c, i) => (
                  <PlayingCard key={i} card={c} size="lg" />
                ))}
                {Array.from({ length: 5 - (pokerState?.community_cards?.length || 0) }).map((_, i) => (
                  <PlayingCard key={`empty-${i}`} size="lg" />
                ))}
              </div>
            </div>

            <div className="mt-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              {canStartHand ? (
                <Button
                  onClick={() => handleAction('start_hand')}
                  disabled={isActing || seats.length < 2}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold"
                >
                  <Icon name="Play" size={16} className="mr-1.5" />
                  Раздать карты
                </Button>
              ) : room.status === 'playing' && stage !== 'waiting' ? (
                <div>
                  <p className="text-sm text-slate-400 mb-3">
                    {isMyTurn ? 'Ваш ход' : 'Ход соперника'} · Ваши фишки: <span className="text-amber-400 font-semibold">{myChips}</span>
                    {toCall > 0 && <> · Чтобы уравнять: <span className="text-amber-400 font-semibold">{toCall}</span></>}
                  </p>
                  {isMyTurn && !myPokerState?.folded && !myPokerState?.all_in && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => handleAction('fold')} disabled={isActing} className="border-red-800 text-red-400 hover:bg-red-500/10">
                        Фолд
                      </Button>
                      {toCall <= 0 ? (
                        <Button onClick={() => handleAction('check')} disabled={isActing} className="bg-slate-700 hover:bg-slate-600 text-white">
                          Чек
                        </Button>
                      ) : (
                        <Button onClick={() => handleAction('call')} disabled={isActing} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                          Колл {toCall}
                        </Button>
                      )}
                      <div className="flex gap-2 items-center">
                        <Input
                          type="number"
                          value={raiseAmount}
                          onChange={(e) => setRaiseAmount(e.target.value)}
                          placeholder="Сумма рейза"
                          className="w-32 bg-slate-800/60 border-slate-700 text-slate-100"
                        />
                        <Button onClick={handleRaise} disabled={isActing} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                          Рейз
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center">
                  {isOwner ? 'Дождитесь ещё игроков и нажмите «Начать игру» выше' : 'Ожидание, пока создатель комнаты начнёт игру...'}
                </p>
              )}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col h-[500px]">
            <div className="p-3 border-b border-slate-800 font-semibold text-slate-200 flex items-center gap-2">
              <Icon name="MessageCircle" size={18} />
              Чат комнаты
            </div>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatMessages.length === 0 ? (
                <p className="text-sm text-slate-500 text-center mt-4">Пока нет сообщений</p>
              ) : (
                chatMessages.map((msg) =>
                  msg.is_system ? (
                    <div key={msg.id} className="flex justify-center">
                      <div className="max-w-[95%] rounded-lg px-3 py-1.5 text-xs text-center bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1.5">
                        <Icon name="Sparkles" size={12} className="shrink-0" />
                        {msg.message}
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className={`flex flex-col ${msg.user_id === user.id ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-500">{msg.nickname}</span>
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm ${
                          msg.user_id === user.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  )
                )
              )}
            </div>
            <div className="p-3 border-t border-slate-800 flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Сообщение..."
                className="bg-slate-800/60 border-slate-700 text-slate-100 placeholder:text-slate-500"
                maxLength={500}
              />
              <Button size="icon" onClick={handleSendChat} className="bg-amber-500 hover:bg-amber-600 text-slate-950 shrink-0">
                <Icon name="Send" size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </GameLayout>
  );
}