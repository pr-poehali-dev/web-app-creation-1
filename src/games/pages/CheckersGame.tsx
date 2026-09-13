import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import GameLayout from '../components/GameLayout';
import InviteShareBox from '../components/InviteShareBox';
import { getGameSession, GameUser } from '../utils/gameAuth';
import { getGameRoom, GameRoomDetail } from '../utils/gameRooms';
import { sendCheckersMove } from '../utils/gameCheckers';
import { getChatMessages, sendChatMessage, ChatMessage } from '../utils/gameChat';
import {
  CBoard,
  Side,
  initialCheckersBoard,
  getAllLegalMoves,
  isWhitePiece,
  isBlackPiece,
  isKingPiece,
} from '../utils/checkersEngine';

export default function CheckersGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user] = useState<GameUser | null>(getGameSession());
  const [room, setRoom] = useState<GameRoomDetail | null>(null);
  const [board, setBoard] = useState<CBoard>(initialCheckersBoard());
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [forcedPiece, setForcedPiece] = useState<[number, number] | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const numericRoomId = Number(roomId);

  const loadRoom = useCallback(async () => {
    try {
      const data = await getGameRoom(numericRoomId);
      setRoom(data);
      const stateBoard = data.state?.board as CBoard | undefined;
      setBoard(stateBoard || initialCheckersBoard());
      const mustContinue = (data.state?.must_continue as [number, number] | null | undefined) ?? null;
      setForcedPiece(mustContinue);
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

  const mySide = room?.players.find((p) => p.user_id === user.id)?.side as Side | undefined;
  const isMyTurn = room?.current_turn_user_id === user.id;
  const opponent = room?.players.find((p) => p.user_id !== user.id);

  const legalMoves = mySide && room?.status === 'playing' && isMyTurn
    ? getAllLegalMoves(board, mySide, forcedPiece)
    : [];

  const selectedMoves = selected
    ? legalMoves.filter((m) => m.from[0] === selected[0] && m.from[1] === selected[1])
    : [];

  const selectablePieces = new Set(legalMoves.map((m) => `${m.from[0]}-${m.from[1]}`));

  const handleSquareClick = async (row: number, col: number) => {
    if (!room || room.status !== 'playing' || !isMyTurn || !mySide) return;

    const piece = board[row][col];
    const key = `${row}-${col}`;

    if (!selected) {
      if (piece && selectablePieces.has(key)) {
        setSelected([row, col]);
      }
      return;
    }

    if (selected[0] === row && selected[1] === col) {
      setSelected(null);
      return;
    }

    const move = selectedMoves.find((m) => m.to[0] === row && m.to[1] === col);
    if (!move) {
      if (piece && selectablePieces.has(key)) {
        setSelected([row, col]);
      } else {
        setSelected(null);
      }
      return;
    }

    setSelected(null);
    const result = await sendCheckersMove(numericRoomId, move.from, move.to);

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Недопустимый ход', description: result.error });
      return;
    }

    await loadRoom();

    if (result.status === 'finished') {
      toast({ title: 'Игра окончена', description: result.winner_id === user.id ? 'Вы победили! 🎉' : 'Соперник победил' });
    } else if (result.must_continue) {
      toast({ title: 'Продолжайте взятие!' });
    }
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

  const displayRows = mySide === 'black' ? [...board].reverse().map((row) => [...row].reverse()) : board;

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
            <div className="flex items-center justify-between mb-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{opponent?.avatar_emoji || '👤'}</span>
                <div>
                  <p className="font-semibold text-slate-100">{opponent?.nickname || 'Ожидание соперника...'}</p>
                  <p className="text-xs text-slate-500">{opponent?.side === 'white' ? 'Белые' : 'Чёрные'}</p>
                </div>
              </div>
              {room.status === 'playing' && (
                <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${isMyTurn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {isMyTurn ? (forcedPiece ? 'Продолжайте взятие' : 'Ваш ход') : 'Ход соперника'}
                </div>
              )}
              {room.status === 'waiting' && (
                <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-800 text-slate-400">
                  Ожидание игрока
                </div>
              )}
              {room.status === 'finished' && (
                <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-600 text-white">
                  {room.winner_id === user.id ? 'Вы победили!' : room.winner_id ? 'Вы проиграли' : 'Ничья'}
                </div>
              )}
            </div>

            <div className="aspect-square w-full max-w-[560px] mx-auto rounded-xl overflow-hidden border-4 border-amber-500/30 shadow-2xl shadow-amber-500/10">
              <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                {displayRows.map((row, rowIdx) =>
                  row.map((piece, colIdx) => {
                    const actualRow = mySide === 'black' ? 7 - rowIdx : rowIdx;
                    const actualCol = mySide === 'black' ? 7 - colIdx : colIdx;
                    const isDark = (rowIdx + colIdx) % 2 === 1;
                    const isSelected = selected?.[0] === actualRow && selected?.[1] === actualCol;
                    const isSelectable = !selected && piece && selectablePieces.has(`${actualRow}-${actualCol}`);
                    const targetMove = selectedMoves.find((m) => m.to[0] === actualRow && m.to[1] === actualCol);

                    return (
                      <button
                        key={`${actualRow}-${actualCol}`}
                        onClick={() => handleSquareClick(actualRow, actualCol)}
                        className={`relative flex items-center justify-center text-3xl sm:text-4xl transition-colors ${
                          isDark ? 'bg-emerald-900' : 'bg-emerald-50'
                        } ${isSelected ? 'ring-4 ring-inset ring-amber-400' : ''} ${
                          isSelectable ? 'ring-2 ring-inset ring-amber-300/60' : ''
                        } hover:opacity-80`}
                      >
                        {piece && (
                          <span
                            className={`h-[72%] w-[72%] rounded-full flex items-center justify-center shadow-md ${
                              isWhitePiece(piece)
                                ? 'bg-gradient-to-br from-slate-100 to-slate-300 border-2 border-slate-400'
                                : 'bg-gradient-to-br from-slate-800 to-slate-950 border-2 border-slate-950'
                            }`}
                          >
                            {isKingPiece(piece) && (
                              <Icon
                                name="Crown"
                                size={20}
                                className={isBlackPiece(piece) ? 'text-amber-400' : 'text-amber-600'}
                              />
                            )}
                          </span>
                        )}
                        {targetMove && (
                          <span
                            className={`absolute rounded-full ${
                              targetMove.captured ? 'h-[40%] w-[40%] border-4 border-red-500/70' : 'h-[28%] w-[28%] bg-amber-400/80'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <span className="text-2xl">{user.avatar_emoji}</span>
              <div>
                <p className="font-semibold text-slate-100">{user.nickname} (Вы)</p>
                <p className="text-xs text-slate-500">{mySide === 'white' ? 'Белые' : 'Чёрные'}</p>
              </div>
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
                chatMessages.map((msg) => (
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
                ))
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