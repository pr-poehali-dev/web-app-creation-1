import { useState, useEffect, useCallback, useRef } from 'react';
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
import DurakCard, { SuitSymbol } from '../components/DurakCard';
import DurakRulesDialog from '../components/DurakRulesDialog';
import { sounds, isSoundOn, setSoundOn } from '../utils/durakSounds';
import { getGameSession, GameUser } from '../utils/gameAuth';
import { getGameRoom, GameRoomDetail } from '../utils/gameRooms';
import { getChatMessages, ChatMessage } from '../utils/gameChat';
import { notifyOpponent } from '../utils/gameNotify';
import {
  DurakState,
  DurakAction,
  sendDurakAction,
  sortHand,
  canBeat,
  canAddCard,
  canTransferCard,
} from '../utils/gameDurak';

const cardName = (c?: string) => (c ? `${c[0] === 'T' ? '10' : c[0]}${{ S: '♠', H: '♥', D: '♦', C: '♣' }[c[1]]}` : '');

export default function DurakGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<GameUser | null>(getGameSession());
  const [room, setRoom] = useState<GameRoomDetail | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [soundOn, setSoundState] = useState(isSoundOn());
  const prevRef = useRef<{ log: number; sig: string; turn: boolean; phase: string; secs: number | null } | null>(null);

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
      // комната может быть временно недоступна
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
    const roomInterval = setVisibleInterval(loadRoom, 2000);
    const chatInterval = setVisibleInterval(loadChat, 3000);
    return () => {
      clearInterval(roomInterval);
      clearInterval(chatInterval);
    };
  }, [user, loadRoom, loadChat, navigate]);

  const state = room?.state as unknown as DurakState | undefined;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const endsAtRef = useRef<number | null>(null);
  const timeoutSentRef = useRef(false);
  const turnKey = `${room?.current_turn_user_id}-${state?.round}-${state?.table?.length}-${state?.table?.filter((p) => p.d).length}-${state?.taking}-${state?.passed?.length}`;

  useEffect(() => {
    timeoutSentRef.current = false;
    endsAtRef.current = state?.turn_left != null ? Date.now() + state.turn_left * 1000 : null;
    setSecondsLeft(state?.turn_left ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (endsAtRef.current == null) {
        setSecondsLeft(null);
        return;
      }
      const left = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0 && !timeoutSentRef.current) {
        timeoutSentRef.current = true;
        sendDurakAction(numericRoomId, 'timeout').then(loadRoom);
      }
    }, 500);
    return () => clearInterval(timer);
  }, [numericRoomId, loadRoom]);

  const hasGame = !!state?.hands;

  useEffect(() => {
    if (!state?.hands || !user) return;
    const sig = `${state.round}-${state.log?.length}-${state.log?.[state.log.length - 1]?.t}-${state.log?.[state.log.length - 1]?.card}`;
    const prev = prevRef.current;
    const last = state.log?.[state.log.length - 1];
    const myTurnNow = room?.current_turn_user_id === user.id;
    if (prev && prev.sig !== sig && last) {
      if (last.t === 'attack') sounds.place();
      else if (last.t === 'defend') sounds.beat();
      else if (last.t === 'transfer') sounds.transfer();
      else if (last.t === 'take' || last.t === 'took') sounds.take();
      else if (last.t === 'bito') sounds.bito();
      else if (last.t === 'deal') sounds.deal();
    } else if (!prev && last?.t === 'deal' && state.phase === 'playing') {
      sounds.deal();
    }
    if (state.phase === 'finished' && prev && prev.phase !== 'finished') {
      if (state.loser === String(user.id)) sounds.lose();
      else sounds.win();
    } else if (state.phase === 'playing' && myTurnNow && (!prev || !prev.turn)) {
      sounds.myTurn();
    }
    prevRef.current = { log: state.log?.length ?? 0, sig, turn: myTurnNow, phase: state.phase, secs: null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  useEffect(() => {
    if (secondsLeft != null && secondsLeft > 0 && secondsLeft <= 5 && room?.current_turn_user_id === user?.id) sounds.tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundState(next);
    if (next) sounds.place();
  };
  const myUid = String(user?.id ?? '');
  const myHand = hasGame ? sortHand(state!.hands[myUid] || [], state!.trump) : [];

  useEffect(() => {
    if (selected && !myHand.includes(selected)) setSelected(null);
  }, [myHand, selected]);

  if (!user) return null;

  const players = room?.players || [];
  const nick = (uid?: string | null) => players.find((p) => String(p.user_id) === uid)?.nickname || 'Игрок';
  const isOwner = room?.created_by === user.id;
  const playing = room?.status === 'playing' && hasGame && state!.phase === 'playing';
  const finished = room?.status === 'finished' && hasGame;
  const iAmDefender = playing && state!.defender === myUid;
  const iAmOut = !!state?.out?.includes(myUid);
  const unbeaten = hasGame ? state!.table.filter((p) => !p.d) : [];
  const turnPlayer = players.find((p) => p.user_id === room?.current_turn_user_id);
  const isMyTurn = room?.current_turn_user_id === user.id;
  const others = (() => {
    const idx = players.findIndex((p) => p.user_id === user.id);
    if (idx < 0) return players;
    return [...players.slice(idx + 1), ...players.slice(0, idx)];
  })();

  const act = async (action: DurakAction, extra?: { card?: string; target?: number }) => {
    if (isActing) return;
    setIsActing(true);
    try {
      const result = await sendDurakAction(numericRoomId, action, extra);
      if (!result.success) {
        toast({ variant: 'destructive', title: 'Так нельзя', description: result.error });
      } else {
        setSelected(null);
      }
      await loadRoom();
    } finally {
      setIsActing(false);
    }
  };

  const handleHandCard = (card: string) => {
    if (!playing || iAmOut) return;
    if (iAmDefender) {
      if (selected === card) {
        setSelected(null);
        return;
      }
      if (!state!.taking && !canTransferCard(state!, card)) {
        const targets = state!.table.map((p, i) => ({ p, i })).filter(({ p }) => !p.d && canBeat(p.a, card, state!.trump));
        if (targets.length === 1) {
          act('defend', { card, target: targets[0].i });
          return;
        }
      }
      setSelected(card);
      return;
    }
    if (canAddCard(state!, myUid, card)) act('attack', { card });
    else toast({ title: 'Эту карту сейчас нельзя подкинуть', description: state!.table.length ? 'Подкидывайте карты того же достоинства, что уже на столе' : 'Сейчас заходит другой игрок' });
  };

  const handleTableTarget = (index: number) => {
    if (!iAmDefender || !selected || state!.taking) return;
    const pair = state!.table[index];
    if (pair.d) return;
    if (!canBeat(pair.a, selected, state!.trump)) {
      toast({ title: 'Этой картой не побить', description: 'Побейте старшей картой той же масти или козырем' });
      return;
    }
    act('defend', { card: selected, target: index });
  };

  const handleNotify = async () => {
    if (!turnPlayer) return;
    setIsNotifying(true);
    try {
      const result = await notifyOpponent({
        opponentUserId: turnPlayer.user_id,
        roomId: numericRoomId,
        senderNickname: user.nickname,
        gameTitle: 'Игра в дурака',
      });
      toast(
        result.success
          ? { title: 'Уведомление отправлено', description: `${turnPlayer.nickname} получит push-уведомление` }
          : { variant: 'destructive', title: 'Не удалось отправить', description: result.error }
      );
    } finally {
      setIsNotifying(false);
    }
  };

  const hint = (() => {
    if (!playing) return '';
    if (iAmOut) return 'Вы вышли из игры — остальные доигрывают';
    const s = state!;
    if (iAmDefender) {
      if (s.taking) return 'Вы берёте карты — ждём, пока доподкинут';
      if (unbeaten.length) return selected ? 'Нажмите на карту на столе, чтобы побить, или переведите' : 'Выберите карту из руки: побить, перевести или «Беру»';
      return 'Всё отбито — ждём «бито» или подкидывание';
    }
    if (!s.table.length) return myUid === s.attacker ? 'Ваш заход: нажмите на карту' : `${nick(s.attacker)} выбирает карту для захода`;
    if (s.taking) return `${nick(s.defender)} берёт — можно подкинуть ещё`;
    return 'Подкидывайте карты того же достоинства или скажите «бито»';
  })();

  const lastEvents = (state?.log || []).slice(-3).reverse().map((e, i) => {
    const who = nick(e.by);
    switch (e.t) {
      case 'attack': return `${who} ходит ${cardName(e.card)}`;
      case 'defend': return `${who} бьёт ${cardName(e.card)}`;
      case 'transfer': return `${who} переводит ${cardName(e.card)} на ${nick(e.to)}`;
      case 'take': return `${who} берёт карты`;
      case 'took': return `${who} забрал ${e.n} карт`;
      case 'bito': return 'Бито';
      case 'out': return `${who} вышел из игры`;
      case 'left': return `${who} покинул игру`;
      case 'timeout': return `${who} не успел — ход сделан автоматически`;
      case 'forfeit': return `${who} долго не отвечал и проиграл`;
      case 'deal': return `Карты розданы, ходит ${who}`;
      default: return i === 0 ? '' : '';
    }
  }).filter(Boolean);

  const canPass = playing && !iAmDefender && !iAmOut && state!.table.length > 0 && (unbeaten.length === 0 || state!.taking) && !state!.passed.includes(myUid);
  const canTake = iAmDefender && unbeaten.length > 0 && !state!.taking;
  const canTransfer = iAmDefender && !!selected && canTransferCard(state!, selected);

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
            <div className="flex items-center justify-between mb-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex-wrap gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <Icon name="Layers" size={20} className="text-amber-400" />
                <span className="font-semibold text-slate-100">Игра в дурака</span>
                {hasGame && (
                  <span className="text-sm text-slate-400 flex items-center gap-1.5">
                    Козырь <SuitSymbol suit={state!.trump} />
                    <span className="text-slate-600">·</span>
                    В колоде {state!.deck_count}
                  </span>
                )}
              </div>
              {room.status === 'waiting' && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-800 text-slate-400">
                    Игроков {players.length}/{room.max_players}
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      onClick={() => act('start')}
                      disabled={isActing || players.length < 2}
                      className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold"
                    >
                      <Icon name="Play" size={14} className="mr-1" />
                      Начать игру
                    </Button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <DurakRulesDialog />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleSound}
                  aria-label={soundOn ? 'Выключить звук' : 'Включить звук'}
                  className="bg-amber-400 hover:bg-amber-500 border-amber-500 text-slate-950 font-semibold hover:text-slate-950 disabled:opacity-70"
                >
                  <Icon name={soundOn ? 'Volume2' : 'VolumeX'} size={14} />
                </Button>
              </div>
              {playing && secondsLeft != null && (
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  secondsLeft <= 10 ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  <Icon name="Timer" size={14} />
                  {isMyTurn ? 'Ваш ход' : `Ходит ${turnPlayer?.nickname || ''}`} · {secondsLeft} с
                </div>
              )}
              {playing && turnPlayer && !isMyTurn && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNotify}
                  disabled={isNotifying}
                  className="bg-amber-400 hover:bg-amber-500 border-amber-500 text-slate-950 font-semibold hover:text-slate-950 disabled:opacity-70"
                >
                  <Icon name={isNotifying ? 'Loader2' : 'BellRing'} size={14} className={isNotifying ? 'mr-1.5 animate-spin' : 'mr-1.5'} />
                  Напомнить: {turnPlayer.nickname}
                </Button>
              )}
              {finished && <RematchButton roomId={numericRoomId} />}
              {finished && <LeaveRoomButton roomId={numericRoomId} />}
            </div>

            <div className="relative bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl border-4 border-amber-700/40 shadow-2xl p-4 sm:p-6 min-h-[420px]">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
                {others.map((p) => {
                  const uid = String(p.user_id);
                  const count = state?.counts?.[uid] ?? 0;
                  const out = state?.out?.includes(uid);
                  const role = playing ? (state!.defender === uid ? 'Отбивается' : state!.attacker === uid ? 'Атакует' : '') : '';
                  const isTurn = playing && room.current_turn_user_id === p.user_id;
                  return (
                    <div
                      key={p.user_id}
                      className={`rounded-xl p-2 min-w-[104px] text-center border-2 ${
                        isTurn ? 'border-amber-400 bg-amber-500/10' : 'border-slate-700/60 bg-slate-900/50'
                      } ${out ? 'opacity-50' : ''}`}
                    >
                      <div className="flex justify-center"><PlayerAvatar emoji={p.avatar_emoji} url={p.avatar_url} size={28} /></div>
                      <p className="text-xs font-semibold text-slate-100 truncate max-w-[92px] mx-auto">{p.nickname}</p>
                      {hasGame && (
                        out ? (
                          <p className="text-[11px] text-emerald-300">Вышел</p>
                        ) : (
                          <div className="mt-1 flex items-center justify-center">
                            <div className="flex -space-x-5">
                              {Array.from({ length: Math.min(count, 6) }).map((_, i) => (
                                <DurakCard key={i} hidden size="xs" />
                              ))}
                            </div>
                            <span className="ml-1.5 text-xs font-bold text-slate-200">{count}</span>
                          </div>
                        )
                      )}
                      {role && <p className={`mt-1 text-[11px] font-semibold ${role === 'Атакует' ? 'text-red-300' : 'text-sky-300'}`}>{role}</p>}
                    </div>
                  );
                })}
              </div>

              {room.status === 'waiting' && (
                <p className="text-center text-sm text-emerald-100/70 py-16">
                  {isOwner ? 'Дождитесь игроков (от 2 до 6) и нажмите «Начать игру»' : 'Ожидаем, пока создатель комнаты начнёт игру...'}
                </p>
              )}

              {hasGame && (
                <div className="flex items-start gap-3 sm:gap-5">
                  <div className="shrink-0 pt-1">
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28">
                      {state!.deck_count > 0 && (
                        <DurakCard card={state!.trump_card} size="sm" trump className="absolute left-8 top-3 sm:left-10 rotate-90 origin-center" />
                      )}
                      {state!.deck_count > 0 ? (
                        <DurakCard hidden size="sm" className="absolute left-0 top-0" />
                      ) : (
                        <div className="absolute left-0 top-0 flex h-16 w-11 items-center justify-center rounded-md border border-dashed border-emerald-300/30 text-2xl">
                          <SuitSymbol suit={state!.trump} />
                        </div>
                      )}
                      {state!.deck_count > 0 && (
                        <span className="absolute -bottom-1 left-0 rounded-full bg-slate-950/80 px-2 py-0.5 text-xs font-bold text-amber-300">
                          {state!.deck_count}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-emerald-100/60">Бито: {state!.discard}</p>
                  </div>

                  <div className="flex-1 min-h-[150px] flex flex-wrap content-start justify-center gap-x-5 gap-y-4">
                    {state!.table.length === 0 && playing && (
                      <p className="self-center text-sm text-emerald-100/50">Стол пуст</p>
                    )}
                    {state!.table.map((pair, i) => {
                      const targetable = iAmDefender && !!selected && !pair.d && !state!.taking && canBeat(pair.a, selected, state!.trump);
                      return (
                        <div key={pair.a} className="relative h-[6.5rem] w-[4.75rem] sm:h-[7.25rem] sm:w-[5.25rem]">
                          <DurakCard
                            card={pair.a}
                            trump={pair.a[1] === state!.trump}
                            highlight={targetable}
                            onClick={!pair.d && iAmDefender && selected ? () => handleTableTarget(i) : undefined}
                          />
                          {pair.d && (
                            <DurakCard card={pair.d} trump={pair.d[1] === state!.trump} className="absolute left-2 top-3 sm:left-2.5 sm:top-3.5 z-10 rotate-3 shadow-xl shadow-black/50" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {finished && (
                <div className="mt-4 rounded-2xl border border-amber-500/40 bg-slate-950/70 p-4 text-center">
                  <p className="text-lg font-bold text-amber-300">
                    {state!.loser
                      ? state!.loser === myUid
                        ? 'Вы остались в дураках'
                        : `${nick(state!.loser)} остался в дураках`
                      : 'Ничья — все вышли одновременно'}
                  </p>
                  {state!.loser !== myUid && state!.loser && (
                    <p className="text-sm text-emerald-300">Вы выиграли партию</p>
                  )}
                  {isOwner && (
                    <Button
                      onClick={() => act('start')}
                      disabled={isActing || players.length < 2}
                      className="mt-3 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold"
                    >
                      <Icon name="RotateCcw" size={16} className="mr-1.5" />
                      Сыграть ещё
                    </Button>
                  )}
                </div>
              )}
            </div>

            {hasGame && (
              <div className="mt-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2 justify-between">
                  <p className="text-sm text-slate-300">
                    {playing ? (
                      <>
                        <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          iAmDefender ? 'bg-sky-500/20 text-sky-300' : myUid === state!.attacker ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {iAmOut ? 'Вышли' : iAmDefender ? 'Отбиваетесь' : myUid === state!.attacker ? 'Атакуете' : 'Подкидываете'}
                        </span>
                        {hint}
                      </>
                    ) : (
                      'Партия завершена'
                    )}
                  </p>
                  <div className="flex gap-2">
                    {canTransfer && (
                      <Button
                        size="sm"
                        disabled={isActing}
                        onClick={() => act('transfer', { card: selected! })}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-semibold"
                      >
                        <Icon name="CornerUpRight" size={14} className="mr-1" />
                        Перевести
                      </Button>
                    )}
                    {canTake && (
                      <Button size="sm" disabled={isActing} onClick={() => act('take')} className="bg-red-500 hover:bg-red-600 text-white font-semibold">
                        <Icon name="Hand" size={14} className="mr-1" />
                        Беру
                      </Button>
                    )}
                    {canPass && (
                      <Button size="sm" disabled={isActing} onClick={() => act('pass')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                        <Icon name="Check" size={14} className="mr-1" />
                        {state!.taking ? 'Хватит' : 'Бито'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-3 min-h-[7rem]">
                  {myHand.length === 0 ? (
                    <p className="self-center text-sm text-slate-500">{iAmOut ? 'У вас не осталось карт' : 'Карт нет'}</p>
                  ) : (
                    myHand.map((card) => {
                      const usable = playing && !iAmOut && (iAmDefender || canAddCard(state!, myUid, card));
                      return (
                        <DurakCard
                          key={card}
                          card={card}
                          trump={card[1] === state!.trump}
                          selected={selected === card}
                          dimmed={playing && !usable}
                          onClick={playing ? () => handleHandCard(card) : undefined}
                        />
                      );
                    })
                  )}
                </div>

                {lastEvents.length > 0 && (
                  <div className="mt-3 border-t border-slate-800 pt-2 text-xs text-slate-500 space-y-0.5">
                    {lastEvents.map((t, i) => (
                      <p key={i} className={i === 0 ? 'text-slate-300' : ''}>{t}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <GameChatPanel roomId={numericRoomId} userId={user.id} messages={chatMessages} onSent={loadChat} />
        </div>
      )}
    </GameLayout>
  );
}
