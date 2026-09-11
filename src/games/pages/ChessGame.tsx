import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess, Square } from 'chess.js';
import Icon from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import GameLayout from '../components/GameLayout';
import { getGameSession, GameUser } from '../utils/gameAuth';
import { getGameRoom, GameRoomDetail } from '../utils/gameRooms';
import { sendChessMove } from '../utils/gameChess';
import { getChatMessages, sendChatMessage, ChatMessage } from '../utils/gameChat';

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔',
};

export default function ChessGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user] = useState<GameUser | null>(getGameSession());
  const [room, setRoom] = useState<GameRoomDetail | null>(null);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const numericRoomId = Number(roomId);

  const loadRoom = useCallback(async () => {
    try {
      const data = await getGameRoom(numericRoomId);
      setRoom(data);
      const fen = (data.state?.fen as string) || undefined;
      if (fen) {
        const newChess = new Chess();
        newChess.load(fen);
        setChess(newChess);
      }
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
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  if (!user) return null;

  const mySide = room?.players.find((p) => p.user_id === user.id)?.side;
  const isMyTurn = room?.current_turn_user_id === user.id;
  const opponent = room?.players.find((p) => p.user_id !== user.id);

  const handleSquareClick = async (square: Square) => {
    if (!room || room.status !== 'playing' || !isMyTurn) return;

    if (!selectedSquare) {
      const piece = chess.get(square);
      if (piece && piece.color === (mySide === 'white' ? 'w' : 'b')) {
        setSelectedSquare(square);
      }
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    const moveUci = `${selectedSquare}${square}`;
    const legalMoves = chess.moves({ square: selectedSquare, verbose: true });
    const needsPromotion = legalMoves.some((m) => m.to === square && m.promotion);
    const finalUci = needsPromotion ? `${moveUci}q` : moveUci;

    setSelectedSquare(null);
    const result = await sendChessMove(numericRoomId, finalUci);

    if (!result.success) {
      toast({ variant: 'destructive', title: 'Недопустимый ход', description: result.error });
      return;
    }

    await loadRoom();

    if (result.is_checkmate) {
      toast({ title: 'Шах и мат!', description: result.winner_id === user.id ? 'Вы победили! 🎉' : 'Соперник победил' });
    } else if (result.is_check) {
      toast({ title: 'Шах!' });
    } else if (result.is_stalemate || result.is_draw) {
      toast({ title: 'Ничья' });
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

  const board = chess.board();
  const displayBoard = mySide === 'black' ? [...board].reverse().map((row) => [...row].reverse()) : board;

  return (
    <GameLayout user={user}>
      <button
        onClick={() => navigate('/games')}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад в лобби
      </button>

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
                  {isMyTurn ? 'Ваш ход' : 'Ход соперника'}
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
                {displayBoard.map((row, rowIdx) =>
                  row.map((piece, colIdx) => {
                    const actualRow = mySide === 'black' ? 7 - rowIdx : rowIdx;
                    const actualCol = mySide === 'black' ? 7 - colIdx : colIdx;
                    const file = String.fromCharCode(97 + actualCol);
                    const rank = 8 - actualRow;
                    const square = `${file}${rank}` as Square;
                    const isDark = (rowIdx + colIdx) % 2 === 1;
                    const isSelected = selectedSquare === square;

                    return (
                      <button
                        key={square}
                        onClick={() => handleSquareClick(square)}
                        className={`flex items-center justify-center text-3xl sm:text-4xl transition-colors ${
                          isDark ? 'bg-slate-700' : 'bg-slate-200'
                        } ${isSelected ? 'ring-4 ring-inset ring-amber-400' : ''} hover:opacity-80`}
                      >
                        {piece && (
                          <span className={piece.color === 'w' ? 'text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : 'text-slate-950'}>
                            {PIECE_SYMBOLS[piece.color === 'w' ? piece.type.toUpperCase() : piece.type]}
                          </span>
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
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
              <div ref={chatEndRef} />
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
