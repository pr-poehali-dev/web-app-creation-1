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
import BaarysRulesDialog from '../components/BaarysRulesDialog';
import { sounds, isSoundOn, setSoundOn } from '../utils/durakSounds';
import { getGameSession, GameUser } from '../utils/gameAuth';
import { getGameRoom, GameRoomDetail } from '../utils/gameRooms';
import { getChatMessages, ChatMessage } from '../utils/gameChat';
import { notifyOpponent } from '../utils/gameNotify';
import { BaarysState, BaarysAction, TARGET, sendBaarysAction, sortHand } from '../utils/gameBaarys';

const REASON: Record<string, string> = {
  baarys: 'Баарыс: шесть козырей одним ходом',
  points: 'набрано 101 очко',
  forfeit: 'соперник не отвечал',
  left: 'соперник покинул игру',
};

export default function BaarysGame() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<GameUser | null>(getGameSession());
  const [room, setRoom] = useState<GameRoomDetail | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [demand, setDemand] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);
  const prevHandRef = useRef<string[] | null>(null);
  const [oppFresh, setOppFresh] = useState(0);
  const prevOppRef = useRef<number | null>(null);
  const [soundOn, setSoundState] = useState(isSoundOn());
  const prevRef = useRef<{ sig: string; turn: boolean; phase: string } | null>(null);

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

  const state = room?.state as unknown as BaarysState | undefined;
  const hasGame = !!state?.hands;

  const myUid = String(user?.id ?? '');
  const myHand = hasGame ? sortHand(state!.hands[myUid] || [], state!.trump) : [];

  useEffect(() => {
    if (!state?.hands || !user) return;
    const last = state.log?.[state.log.length - 1];
    const sig = `${state.game_no}-${state.log?.length}-${last?.t}`;
    const myTurnNow = room?.current_turn_user_id === user.id;
    const prev = prevRef.current;
    if (prev && prev.sig !== sig && last) {
      if (last.t === 'lead') sounds.place();
      else if (last.t === 'beat') sounds.beat();
      else if (last.t === 'take') sounds.take();
      else if (last.t === 'deal') sounds.deal();
    } else if (!prev && last?.t === 'deal' && state.phase === 'playing') {
      sounds.deal();
    }
    if (state.phase === 'finished' && prev && prev.phase !== 'finished') {
      if (state.winner === myUid) sounds.win();
      else sounds.lose();
    } else if (state.phase === 'playing' && myTurnNow && (!prev || !prev.turn)) {
      sounds.myTurn();
    }
    prevRef.current = { sig, turn: myTurnNow, phase: state.phase };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  useEffect(() => {
    const prev = prevHandRef.current;
    prevHandRef.current = myHand;
    if (!prev) return;
    const added = myHand.filter((c) => !prev.includes(c));
    if (!added.length) return;
    setFresh(added);
    if (isSoundOn() && state?.log?.[state.log.length - 1]?.t !== 'deal') sounds.draw(added.length);
    const t = setTimeout(() => setFresh([]), 450 + added.length * 220);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myHand.join(',')]);

  const oppCount = state?.counts?.[String(room?.players?.find((p) => p.user_id !== user?.id)?.user_id ?? '')] ?? 0;
  useEffect(() => {
    const prev = prevOppRef.current;
    prevOppRef.current = oppCount;
    if (prev === null || oppCount <= prev) return;
    const n = oppCount - prev;
    setOppFresh(n);
    if (isSoundOn() && state?.log?.[state.log.length - 1]?.t !== 'deal') sounds.draw(n);
    const t = setTimeout(() => setOppFresh(0), 450 + n * 220);
    return () => clearTimeout(t);
  }, [oppCount]);

  useEffect(() => {
    setSelected((cur) => cur.filter((c) => myHand.includes(c)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myHand.join(',')]);

  useEffect(() => {
    if (demand && !(state && state.deck_count === 0 && selected.length > 0 && selected.every((c) => c[1] === state.trump))) {
      setDemand(false);
    }
  }, [selected, demand, state]);

  if (!user) return null;

  const players = room?.players || [];
  const nick = (uid?: string | null) => players.find((p) => String(p.user_id) === uid)?.nickname || 'Игрок';
  const opponent = players.find((p) => p.user_id !== user.id);
  const oppUid = opponent ? String(opponent.user_id) : '';
  const isOwner = room?.created_by === user.id;
  const playing = room?.status === 'playing' && hasGame && state!.phase === 'playing';
  const finished = room?.status === 'finished' && hasGame;
  const isMyTurn = room?.current_turn_user_id === user.id;
  const turnPlayer = players.find((p) => p.user_id === room?.current_turn_user_id);
  const iLead = playing && isMyTurn && state!.lead.length === 0;
  const iRespond = playing && isMyTurn && state!.lead.length > 0;
  const needCount = iRespond ? state!.lead.length : 0;
  const canSwap = playing && isMyTurn && state!.deck_count > 0 && state!.trump_card !== `6${state!.trump}` && myHand.includes(`6${state!.trump}`);
  const canDemand = iLead && state!.deck_count === 0 && selected.length > 0 && selected.every((c) => c[1] === state!.trump);

  const act = async (action: BaarysAction, extra?: { cards?: string[]; demand?: boolean }) => {
    if (isActing) return;
    setIsActing(true);
    try {
      const result = await sendBaarysAction(numericRoomId, action, extra);
      if (!result.success) {
        toast({ variant: 'destructive', title: 'Так нельзя', description: result.error });
      } else {
        setSelected([]);
        setDemand(false);
      }
      await loadRoom();
    } finally {
      setIsActing(false);
    }
  };

  const toggleCard = (card: string) => {
    if (!playing || !isMyTurn) return;
    setSelected((cur) => {
      if (cur.includes(card)) return cur.filter((c) => c !== card);
      if (iLead) {
        if (cur.length && cur[0][1] !== card[1]) return [card];
        return cur.length >= 6 ? cur : [...cur, card];
      }
      return cur.length >= needCount ? cur : [...cur, card];
    });
  };

  const submit = () => {
    if (iLead) act('lead', { cards: selected, demand });
    else if (iRespond) act('respond', { cards: selected });
  };

  const handleNotify = async () => {
    if (!turnPlayer) return;
    setIsNotifying(true);
    try {
      const result = await notifyOpponent({
        opponentUserId: turnPlayer.user_id,
        roomId: numericRoomId,
        senderNickname: user.nickname,
        gameTitle: 'Баарыс',
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
    if (iLead) return 'Ваш заход: выберите карты одной масти (до 6) и нажмите «Сходить»';
    if (iRespond) return `Побейте каждую карту: выберите ${needCount} ${needCount === 1 ? 'карту' : 'карт'} и нажмите «Ответить»`;
    if (state!.lead.length) return `${nick(turnPlayer?.user_id ? String(turnPlayer.user_id) : null)} отвечает на ваш ход`;
    return `${nick(state!.leader)} выбирает карты для хода`;
  })();

  const lastEvents = (state?.log || []).slice(-3).reverse().map((e) => {
    const who = nick(e.by);
    switch (e.t) {
      case 'lead': return `${who} ходит ${e.n} ${e.n === 1 ? 'картой' : 'картами'}${e.demand ? ' и требует козыри' : ''}`;
      case 'beat': return `${who} побил и забрал ход (+${e.n})`;
      case 'take': return `${who} забрал ход, соперник не побил (+${e.n})`;
      case 'bonus': return `${who} получает бонус за даму и короля +${e.n}`;
      case 'last': return `${who} забрал последний ход +${e.n}`;
      case 'game_end': return `Партия ${e.n} завершена, новая раздача`;
      case 'baarys': return `${who} ходит шестью козырями: Баарыс!`;
      case 'swap': return `${who} поменял козырь на козырную шестёрку`;
      case 'left': return `${who} покинул игру`;
      case 'timeout': return `${who} не успел: ход сделан автоматически`;
      case 'forfeit': return `${who} долго не отвечал и проиграл`;
      case 'deal': return `Карты розданы, ходит ${who}`;
      default: return '';
    }
  }).filter(Boolean);

  const trick = state?.last_trick;
  const rows = hasGame
    ? [
        ...(state!.history || []).map((h) => ({ label: `Партия ${h.game_no}`, points: h.points, current: false })),
        ...(state!.phase === 'playing' ? [{ label: `Партия ${state!.game_no} (идёт)`, points: state!.game_points || {}, current: true }] : []),
      ]
    : [];
  const ScoreTable = () => (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-xs min-w-[240px]">
      <div className="grid grid-cols-[1fr_64px_64px] gap-x-2 text-slate-400 mb-1">
        <span />
        <span className="text-center truncate">{opponent?.nickname}</span>
        <span className="text-center">Вы</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className={`grid grid-cols-[1fr_64px_64px] gap-x-2 py-0.5 ${r.current ? 'text-slate-100' : 'text-slate-300'}`}>
          <span>{r.label}</span>
          <span className="text-center">{r.points[oppUid] ?? 0}</span>
          <span className="text-center">{r.points[myUid] ?? 0}</span>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_64px_64px] gap-x-2 border-t border-slate-700 mt-1 pt-1 font-bold text-amber-300">
        <span>Всего из {TARGET}</span>
        <span className="text-center">{state!.scores?.[oppUid] ?? 0}</span>
        <span className="text-center">{state!.scores?.[myUid] ?? 0}</span>
      </div>
    </div>
  );

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
                <Icon name="Swords" size={20} className="text-amber-400" />
                <span className="font-semibold text-slate-100">Баарыс</span>
                {hasGame && (
                  <span className="text-sm text-slate-400 flex items-center gap-1.5">
                    Козырь <SuitSymbol suit={state!.trump} />
                    <span className="text-slate-600">·</span>
                    В колоде {state!.deck_count}
                    <span className="text-slate-600">·</span>
                    Партия {state!.game_no}
                  </span>
                )}
              </div>
              {room.status === 'waiting' && (
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-800 text-slate-400">
                    Игроков {players.length}/2
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
                <BaarysRulesDialog />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const next = !soundOn;
                    setSoundOn(next);
                    setSoundState(next);
                    if (next) sounds.place();
                  }}
                  aria-label={soundOn ? 'Выключить звук' : 'Включить звук'}
                  className="bg-amber-400 hover:bg-amber-500 border-amber-500 text-slate-950 font-semibold hover:text-slate-950 disabled:opacity-70"
                >
                  <Icon name={soundOn ? 'Volume2' : 'VolumeX'} size={14} />
                </Button>
              </div>
              {playing && (
                <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold bg-slate-800 text-slate-300">
                  <Icon name="User" size={14} />
                  {isMyTurn ? 'Ваш ход' : `Ходит ${turnPlayer?.nickname || ''}`}
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
              {playing && <LeaveRoomButton roomId={numericRoomId} playing />}
              {finished && <LeaveRoomButton roomId={numericRoomId} />}
            </div>

            <div className="relative bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-3xl border-4 border-amber-700/40 shadow-2xl p-4 sm:p-6 min-h-[420px]">
              {opponent && (
                <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
                  <div className={`rounded-xl p-2 min-w-[120px] text-center border-2 ${
                    playing && room.current_turn_user_id === opponent.user_id ? 'border-amber-400 bg-amber-500/10' : 'border-slate-700/60 bg-slate-900/50'
                  }`}>
                    <div className="flex justify-center"><PlayerAvatar emoji={opponent.avatar_emoji} url={opponent.avatar_url} size={28} online={opponent.online} /></div>
                    <p className="text-xs font-semibold text-slate-100 truncate max-w-[104px] mx-auto">{opponent.nickname}</p>
                    {hasGame && (
                      <div className="mt-1 flex items-center justify-center">
                        <div className="flex -space-x-5">
                          {Array.from({ length: Math.min(state!.counts?.[oppUid] ?? 0, 6) }).map((_, i, arr) => {
                            const k = i - (arr.length - oppFresh);
                            const isNew = oppFresh > 0 && k >= 0;
                            return (
                              <div
                                key={i}
                                className={isNew ? 'baarys-deal' : ''}
                                style={isNew ? { animationDelay: `${k * 220}ms` } : undefined}
                              >
                                <DurakCard hidden size="xs" />
                              </div>
                            );
                          })}
                        </div>
                        <span className="ml-1.5 text-xs font-bold text-slate-200">{state!.counts?.[oppUid] ?? 0}</span>
                      </div>
                    )}
                  </div>
                  {hasGame && (
                    <ScoreTable />
                  )}
                </div>
              )}

              {room.status === 'waiting' && (
                <p className="text-center text-sm text-emerald-100/70 py-16">
                  {isOwner ? 'Дождитесь соперника и нажмите «Начать игру»' : 'Ожидаем, пока создатель комнаты начнёт игру...'}
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
                  </div>

                  <div className="flex-1 min-h-[150px] flex flex-col items-center justify-center gap-3">
                    {state!.lead.length > 0 ? (
                      <>
                        <p className="text-xs text-emerald-100/70">
                          Ход {nick(state!.leader)}{state!.demand ? ' · требует козыри' : ''}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {state!.lead.map((c) => (
                            <DurakCard key={c} card={c} size="sm" trump={c[1] === state!.trump} />
                          ))}
                        </div>
                      </>
                    ) : trick ? (
                      <>
                        <p className="text-xs text-emerald-100/70">
                          Прошлый ход: {nick(trick.winner)} забрал +{trick.points + trick.bonus}
                          {trick.bonus ? ` (бонус ${trick.bonus})` : ''}
                        </p>
                        {trick.beaten ? (
                          <div className="flex flex-wrap justify-center gap-x-4 gap-y-3">
                            {trick.lead.map((c, i) => (
                              <div key={c} className="relative h-[4.75rem] w-[3.25rem]">
                                <DurakCard card={c} size="sm" trump={c[1] === state!.trump} />
                                {trick.resp[i] && (
                                  <DurakCard card={trick.resp[i]} size="sm" trump={trick.resp[i][1] === state!.trump} className="absolute left-1.5 top-2.5 z-10 rotate-3 shadow-xl shadow-black/50" />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap justify-center gap-1 opacity-80">
                            {[...trick.lead, ...trick.resp].map((c) => (
                              <DurakCard key={c} card={c} size="xs" trump={c[1] === state!.trump} />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      playing && <p className="text-sm text-emerald-100/50">Стол пуст</p>
                    )}
                  </div>
                </div>
              )}

              {finished && (
                <div className="mt-4 rounded-2xl border border-amber-500/40 bg-slate-950/70 p-4 text-center">
                  <p className="text-lg font-bold text-amber-300">
                    {state!.winner === myUid ? 'Вы победили' : `${nick(state!.winner)} победил`}
                    {state!.multiplier === 2 ? ' вдвойне' : ''}
                  </p>
                  {state!.reason && <p className="text-sm text-emerald-300">{REASON[state!.reason] || ''}</p>}
                  <div className="mt-3 flex justify-center"><ScoreTable /></div>
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
                  <p className="text-sm text-slate-300">{playing ? hint : 'Матч завершён'}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {canDemand && (
                      <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={demand} onChange={(e) => setDemand(e.target.checked)} />
                        Требовать козыри
                      </label>
                    )}
                    {canSwap && (
                      <Button size="sm" disabled={isActing} onClick={() => act('swap')} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                        <Icon name="Repeat" size={14} className="mr-1" />
                        Поменять козырь
                      </Button>
                    )}
                    {(iLead || iRespond) && (
                      <Button
                        size="sm"
                        disabled={isActing || selected.length === 0 || (iRespond && selected.length !== needCount)}
                        onClick={submit}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <Icon name="Check" size={14} className="mr-1" />
                        {iLead ? 'Сходить' : 'Ответить'}
                        {selected.length ? ` (${selected.length})` : ''}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-3 min-h-[7rem]">
                  {myHand.length === 0 ? (
                    <p className="self-center text-sm text-slate-500">Карт нет</p>
                  ) : (
                    myHand.map((card) => (
                      <div
                        key={card}
                        className={fresh.includes(card) ? 'baarys-deal' : ''}
                        style={fresh.includes(card) ? { animationDelay: `${fresh.indexOf(card) * 220}ms` } : undefined}
                      >
                        <DurakCard
                          card={card}
                          trump={card[1] === state!.trump}
                          selected={selected.includes(card)}
                          dimmed={playing && !isMyTurn}
                          onClick={playing && isMyTurn ? () => toggleCard(card) : undefined}
                        />
                      </div>
                    ))
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
