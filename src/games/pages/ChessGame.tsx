import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess, Square } from 'chess.js';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import GameLayout from '../components/GameLayout';
import InviteShareBox from '../components/InviteShareBox';
import LeaveRoomButton from '../components/LeaveRoomButton';
import RematchButton from '../components/RematchButton';
import { getGameSession, GameUser } from '../utils/gameAuth';
import { getGameRoom, GameRoomDetail } from '../utils/gameRooms';
import { sendChessMove } from '../utils/gameChess';
import { getChatMessages, ChatMessage } from '../utils/gameChat';
import GameChatPanel from '../components/GameChatPanel';
import RoomNotifyHint from '../components/RoomNotifyHint';
import PlayerAvatar from '../components/PlayerAvatar';
import { notifyOpponent } from '../utils/gameNotify';
import GameHeaderTools, { YELLOW_BUTTON } from '../components/GameHeaderTools';
import ChessRulesDialog from '../components/ChessRulesDialog';
import { useBoardSounds } from '../hooks/useBoardSounds';

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟\uFE0E', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔',
};

export default function ChessGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<GameUser | null>(getGameSession());

  useEffect(() => {
    const sync = () => setUser(getGameSession());
    window.addEventListener('gameSessionChanged', sync);
    return () => window.removeEventListener('gameSessionChanged', sync);
  }, []);
  const [room, setRoom] = useState<GameRoomDetail | null>(null);
  const [chess, setChess] = useState<Chess>(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isNotifying, setIsNotifying] = useState(false);

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

  useBoardSounds(room, user?.id, (state) => {
    const c = new Chess();
    try {
      c.load((state.fen as string) || new Chess().fen());
    } catch {
      return { pieces: 0, check: false };
    }
    return { pieces: c.board().flat().filter(Boolean).length, check: c.isCheck() };
  });

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

  const handleNotifyOpponent = async () => {
    if (!opponent) return;
    setIsNotifying(true);
    try {
      const result = await notifyOpponent({
        opponentUserId: opponent.user_id,
        roomId: numericRoomId,
        senderNickname: user.nickname,
        gameTitle: 'Шахматы',
      });
      if (result.success) {
        toast({ title: 'Уведомление отправлено', description: `${opponent.nickname} получит push-уведомление` });
      } else {
        toast({ variant: 'destructive', title: 'Не удалось отправить', description: result.error });
      }
    } finally {
      setIsNotifying(false);
    }
  };

  const board = chess.board();
  const displayBoard = mySide === 'black' ? [...board].reverse().map((row) => [...row].reverse()) : board;

  return (
    <GameLayout user={user}>
      <RoomNotifyHint />
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
            <div className="flex items-center justify-between gap-2 flex-wrap mb-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <PlayerAvatar emoji={opponent?.avatar_emoji} url={opponent?.avatar_url} size={36} />
                <div>
                  <p className="font-semibold text-slate-100">{opponent?.nickname || 'Ожидание соперника...'}</p>
                  <p className="text-xs text-slate-500">{opponent?.side === 'white' ? 'Белые' : 'Чёрные'}</p>
                </div>
              </div>
              <GameHeaderTools rules={<ChessRulesDialog />} />
              {room.status === 'playing' && (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${isMyTurn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {isMyTurn ? 'Ваш ход' : 'Ход соперника'}
                  </div>
                  {!isMyTurn && opponent && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNotifyOpponent}
                      disabled={isNotifying}
                      className={YELLOW_BUTTON}
                      title="Напомнить сопернику о ходе push-уведомлением"
                    >
                      <Icon name={isNotifying ? 'Loader2' : 'BellRing'} size={14} className={isNotifying ? 'mr-1.5 animate-spin' : 'mr-1.5'} />
                      Напомнить
                    </Button>
                  )}
                </div>
              )}
              {room.status === 'waiting' && (
                <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-800 text-slate-400">
                  Ожидание игрока
                </div>
              )}
              {room.status === 'finished' && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-600 text-white">
                    {room.winner_id === user.id ? 'Вы победили!' : room.winner_id ? 'Вы проиграли' : 'Ничья'}
                  </div>
                  <RematchButton roomId={numericRoomId} />
                  <LeaveRoomButton roomId={numericRoomId} />
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
                          isDark ? 'bg-slate-400' : 'bg-slate-200'
                        } ${isSelected ? 'ring-4 ring-inset ring-amber-400' : ''} hover:opacity-80`}
                      >
                        {piece && (
                          <span
                            className={`${piece.color === 'w' ? 'text-white' : 'text-slate-950'} ${
                              piece.type === 'p'
                                ? 'text-xl sm:text-2xl'
                                : 'text-4xl sm:text-5xl'
                            }`}
                            style={piece.color === 'w' ? {
                              WebkitTextStroke: '1.5px #1e293b',
                              paintOrder: 'stroke fill',
                            } : undefined}
                          >
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
              <PlayerAvatar emoji={user.avatar_emoji} url={user.avatar_url} size={36} />
              <div>
                <p className="font-semibold text-slate-100">{user.nickname} (Вы)</p>
                <p className="text-xs text-slate-500">{mySide === 'white' ? 'Белые' : 'Чёрные'}</p>
              </div>
            </div>
          </div>

          <GameChatPanel roomId={numericRoomId} userId={user.id} messages={chatMessages} onSent={loadChat} />
        </div>
      )}
    </GameLayout>
  );
}