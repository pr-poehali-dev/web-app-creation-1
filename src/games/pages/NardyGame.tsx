import { useState, useEffect, useCallback } from 'react';
import { setVisibleInterval } from '../utils/visibleInterval';
import { useParams, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import GameLayout from '../components/GameLayout';
import InviteShareBox from '../components/InviteShareBox';
import LeaveRoomButton from '../components/LeaveRoomButton';
import RematchButton from '../components/RematchButton';
import GameChatPanel from '../components/GameChatPanel';
import RoomNotifyHint from '../components/RoomNotifyHint';
import PlayerAvatar from '../components/PlayerAvatar';
import GameHeaderTools, { YELLOW_BUTTON } from '../components/GameHeaderTools';
import NardyRulesDialog from '../components/NardyRulesDialog';
import { getGameSession, GameUser } from '../utils/gameAuth';
import { getGameRoom, GameRoomDetail } from '../utils/gameRooms';
import { getChatMessages, ChatMessage } from '../utils/gameChat';
import { notifyOpponent } from '../utils/gameNotify';
import { NardyState, sendNardyAction } from '../utils/gameNardy';
import { useBoardSounds } from '../hooks/useBoardSounds';

const PIPS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, used }: { value: number; used: boolean }) {
  return (
    <div className={`grid grid-cols-3 grid-rows-3 gap-0.5 p-1.5 h-11 w-11 rounded-lg border-2 shadow-md ${
      used ? 'bg-slate-700 border-slate-600 opacity-40' : 'bg-amber-50 border-amber-300'
    }`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <span key={i} className={`rounded-full ${PIPS[value].includes(i) ? (used ? 'bg-slate-400' : 'bg-slate-900') : ''}`} />
      ))}
    </div>
  );
}

export default function NardyGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<GameUser | null>(getGameSession());
  const [room, setRoom] = useState<GameRoomDetail | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isNotifying, setIsNotifying] = useState(false);
  const [busy, setBusy] = useState(false);
  const numericRoomId = Number(roomId);

  useEffect(() => {
    const sync = () => setUser(getGameSession());
    window.addEventListener('gameSessionChanged', sync);
    return () => window.removeEventListener('gameSessionChanged', sync);
  }, []);

  const loadRoom = useCallback(async () => {
    try {
      setRoom(await getGameRoom(numericRoomId));
    } catch {
      // ignore
    }
  }, [numericRoomId]);

  const loadChat = useCallback(async () => {
    try {
      setChatMessages(await getChatMessages(numericRoomId));
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
    const a = setVisibleInterval(loadRoom, 2000);
    const b = setVisibleInterval(loadChat, 3000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [user, loadRoom, loadChat, navigate]);

  const state = room?.state as unknown as NardyState | undefined;
  const hasState = !!state?.pts_w;

  useBoardSounds(room, user?.id, (s) => {
    const st = s as unknown as NardyState;
    return { pieces: st.pts_w ? 30 - st.off_w - st.off_b : 30, check: false };
  });

  useEffect(() => {
    setSelected(null);
  }, [state?.seq]);

  if (!user) return null;

  const me = room?.players.find((p) => p.user_id === user.id);
  const opponent = room?.players.find((p) => p.user_id !== user.id);
  const mySide: 'w' | 'b' = me?.side === 'black' ? 'b' : 'w';
  const offset = mySide === 'b' ? 12 : 0;
  const playing = room?.status === 'playing' && hasState;
  const isMyTurn = room?.current_turn_user_id === user.id;
  const canRoll = playing && isMyTurn && !state!.rolled;
  const myMoves = playing && isMyTurn && state!.rolled ? state!.legal : [];
  const movable = new Set(myMoves.map((m) => m.from));
  const selMoves = selected != null ? myMoves.filter((m) => m.from === selected) : [];
  const targets = new Map<number, number>();
  selMoves.forEach((m) => {
    if (m.to != null) targets.set(m.to, m.die);
  });
  const offMoves = selMoves.filter((m) => m.to == null);

  const act = async (action: 'roll' | 'move', extra?: { from?: number; die?: number }) => {
    if (busy) return;
    setBusy(true);
    const result = await sendNardyAction(numericRoomId, action, extra);
    setBusy(false);
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Нельзя', description: result.error });
    }
    await loadRoom();
  };

  const handlePointClick = (abs: number) => {
    if (!playing || !isMyTurn || !state!.rolled) return;
    if (selected != null && targets.has(abs)) {
      act('move', { from: selected, die: targets.get(abs)! });
      return;
    }
    if (movable.has(abs)) setSelected(selected === abs ? null : abs);
    else setSelected(null);
  };

  const handleNotify = async () => {
    if (!opponent) return;
    setIsNotifying(true);
    try {
      const r = await notifyOpponent({
        opponentUserId: opponent.user_id,
        roomId: numericRoomId,
        senderNickname: user.nickname,
        gameTitle: 'Длинные нарды',
      });
      if (r.success) toast({ title: 'Уведомление отправлено', description: `${opponent.nickname} получит push-уведомление` });
      else toast({ variant: 'destructive', title: 'Не удалось отправить', description: r.error });
    } finally {
      setIsNotifying(false);
    }
  };

  const countAt = (abs: number) => {
    if (!hasState) return { w: 0, b: 0 };
    return { w: state!.pts_w[abs], b: state!.pts_b[abs] };
  };

  const renderPoint = (k: number) => {
    const abs = (k + offset) % 24;
    const top = k < 12;
    const col = top ? 11 - k : k - 12;
    const { w, b } = countAt(abs);
    const side: 'w' | 'b' | null = w > 0 ? 'w' : b > 0 ? 'b' : null;
    const count = w || b;
    const isSel = selected === abs;
    const isTarget = targets.has(abs);
    const isMovable = !selected && movable.has(abs);
    const shown = Math.min(count, 5);
    return (
      <button
        key={k}
        onClick={() => handlePointClick(abs)}
        style={{ gridColumn: col + 1, gridRow: top ? 1 : 2 }}
        className={`relative flex ${top ? 'flex-col justify-start' : 'flex-col-reverse justify-start'} items-center h-full min-w-0 ${
          isSel ? 'bg-amber-400/25' : isTarget ? 'bg-emerald-400/25' : ''
        }`}
      >
        <span
          className={`absolute inset-x-[8%] ${top ? 'top-0' : 'bottom-0'} h-[92%] ${col % 2 === 0 ? 'bg-amber-800/70' : 'bg-orange-200/60'}`}
          style={{ clipPath: top ? 'polygon(0 0, 100% 0, 50% 100%)' : 'polygon(0 100%, 100% 100%, 50% 0)' }}
        />
        {isTarget && (
          <span className={`absolute z-10 ${top ? 'top-[40%]' : 'bottom-[40%]'} h-3 w-3 rounded-full bg-emerald-400`} />
        )}
        {Array.from({ length: shown }).map((_, i) => (
          <span
            key={i}
            className={`relative z-10 aspect-square w-[78%] max-w-[40px] rounded-full border-2 shadow-md flex items-center justify-center text-[10px] font-bold ${
              side === 'w'
                ? 'bg-gradient-to-br from-slate-50 to-slate-300 border-slate-400 text-slate-700'
                : 'bg-gradient-to-br from-slate-700 to-slate-950 border-slate-950 text-slate-200'
            } ${isMovable && i === shown - 1 ? 'ring-2 ring-amber-300' : ''} ${isSel && i === shown - 1 ? 'ring-2 ring-amber-400' : ''}`}
          >
            {i === shown - 1 && count > shown ? count : ''}
          </span>
        ))}
      </button>
    );
  };

  const shownDice = hasState && state!.last_roll
    ? (state!.last_roll[0] === state!.last_roll[1] ? Array(4).fill(state!.last_roll[0]) : state!.last_roll)
    : [];
  const remaining = hasState ? [...state!.dice] : [];
  const diceView = shownDice.map((v: number) => {
    const idx = remaining.indexOf(v);
    if (idx >= 0) {
      remaining.splice(idx, 1);
      return { v, used: false };
    }
    return { v, used: true };
  });

  const myOff = hasState ? (mySide === 'w' ? state!.off_w : state!.off_b) : 0;
  const oppOff = hasState ? (mySide === 'w' ? state!.off_b : state!.off_w) : 0;
  const sideName = (s?: string | null) => (s === 'white' ? 'Белые' : 'Чёрные');

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
                  <p className="text-xs text-slate-500">{opponent ? `${sideName(opponent.side)} · выведено ${oppOff} из 15` : ''}</p>
                </div>
              </div>
              <GameHeaderTools rules={<NardyRulesDialog />} />
              {playing && (
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${isMyTurn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {isMyTurn ? (state!.rolled ? 'Ваш ход' : 'Бросьте кубики') : 'Ход соперника'}
                  </div>
                  {!isMyTurn && opponent && (
                    <Button size="sm" variant="outline" onClick={handleNotify} disabled={isNotifying} className={YELLOW_BUTTON}>
                      <Icon name={isNotifying ? 'Loader2' : 'BellRing'} size={14} className={isNotifying ? 'mr-1.5 animate-spin' : 'mr-1.5'} />
                      Напомнить
                    </Button>
                  )}
                  {opponent && <LeaveRoomButton roomId={numericRoomId} playing />}
                </div>
              )}
              {room.status === 'waiting' && (
                <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-800 text-slate-400">Ожидание игрока</div>
              )}
              {room.status === 'finished' && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-600 text-white">
                    {room.winner_id === user.id ? 'Вы победили!' : 'Вы проиграли'}
                  </div>
                  <RematchButton roomId={numericRoomId} />
                  <LeaveRoomButton roomId={numericRoomId} />
                </div>
              )}
            </div>

            <div className="rounded-xl border-4 border-amber-700/50 bg-gradient-to-br from-emerald-900 to-emerald-950 shadow-2xl p-2 sm:p-3">
              <div className="grid grid-cols-12 grid-rows-2 gap-y-2 h-[360px] sm:h-[440px]">
                {Array.from({ length: 24 }).map((_, k) => renderPoint(k))}
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-h-[44px]">
                  {diceView.map((d: { v: number; used: boolean }, i: number) => (
                    <Die key={i} value={d.v} used={d.used} />
                  ))}
                  {playing && state!.event?.t === 'pass' && (
                    <span className="text-xs text-amber-300">Нет доступных ходов, ход переходит</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canRoll && (
                    <Button onClick={() => act('roll')} disabled={busy} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                      <Icon name="Dices" size={16} className="mr-1.5" />
                      Бросить кубики
                    </Button>
                  )}
                  {offMoves.map((m) => (
                    <Button
                      key={m.die}
                      onClick={() => act('move', { from: m.from, die: m.die })}
                      disabled={busy}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                    >
                      Вывести ({m.die})
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <PlayerAvatar emoji={user.avatar_emoji} url={user.avatar_url} size={36} />
              <div>
                <p className="font-semibold text-slate-100">{user.nickname} (Вы)</p>
                <p className="text-xs text-slate-500">{`${sideName(me?.side)} · выведено ${myOff} из 15`}</p>
              </div>
            </div>
          </div>

          <GameChatPanel roomId={numericRoomId} userId={user.id} messages={chatMessages} onSent={loadChat} />
        </div>
      )}
    </GameLayout>
  );
}
