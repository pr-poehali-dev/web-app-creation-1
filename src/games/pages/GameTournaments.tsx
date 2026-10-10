import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import GameLayout from '../components/GameLayout';
import { getGameSession } from '../utils/gameAuth';
import { playerCall, Tournament, STATUS_LABEL, GAME_LABEL, formatTimeout } from '../utils/gameTournaments';

export default function GameTournaments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getGameSession();
  const [list, setList] = useState<Tournament[]>([]);
  const [open, setOpen] = useState<Tournament | null>(null);

  const load = useCallback(async () => {
    try {
      setList((await playerCall('tournaments')).tournaments);
      if (open) setOpen(await playerCall('tournament', { query: { tournament_id: open.id } }));
    } catch { /* сервис может разворачиваться */ }
  }, [open?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) { navigate('/games/auth'); return; }
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (action: string, id: number) => {
    try {
      await playerCall(action, { body: { tournament_id: id } });
      await load();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ошибка', description: (e as Error).message });
    }
  };

  const show = async (id: number) => {
    try { setOpen(await playerCall('tournament', { query: { tournament_id: id } })); } catch { /* */ }
  };

  const myMatch = open?.matches?.find(m => m.status === 'playing' && (m.player1_id === user?.id || m.player2_id === user?.id));
  const rounds = open?.matches ? Array.from(new Set(open.matches.map(m => m.round))) : [];

  return (
    <GameLayout user={user}>
      <Link to="/games" className="text-sm text-slate-400 hover:text-amber-400 inline-flex items-center gap-1 mb-4">
        <Icon name="ArrowLeft" size={14} />В лобби
      </Link>
      <h1 className="text-3xl font-bold mb-1">🏆 Турниры</h1>
      <p className="text-slate-400 mb-6">Олимпийская система: проиграл — выбыл. Победитель забирает призовой фонд.</p>

      {!open ? (
        <div className="grid gap-3 md:grid-cols-2">
          {list.length === 0 && <p className="text-slate-400">Турниров пока нет</p>}
          {list.map(t => (
            <div key={t.id} onClick={() => show(t.id)} className="cursor-pointer bg-slate-900/60 border border-amber-500/20 hover:border-amber-500/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between gap-2">
                <span className="font-semibold">{t.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">{STATUS_LABEL[t.status]}</span>
              </div>
              <div className="text-xs text-slate-400 flex flex-wrap gap-x-3">
                <span>{GAME_LABEL[t.game_type]}</span>
                <span>игроков {t.players_count}/{t.max_players}</span>
                <span>взнос {t.entry_fee}</span>
                <span>фонд {t.prize_pool}</span>
              </div>
              {t.joined && <div className="text-xs text-emerald-400">Вы участвуете</div>}
              {t.winner_nickname && <div className="text-sm">Победитель: <b>{t.winner_nickname}</b></div>}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <Button variant="outline" size="sm" onClick={() => setOpen(null)}>← Ко всем турнирам</Button>
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <div className="flex justify-between"><h2 className="text-xl font-bold">{open.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 h-fit">{STATUS_LABEL[open.status]}</span></div>
            {open.description && <p className="text-slate-300 text-sm">{open.description}</p>}
            <div className="text-sm text-slate-400 flex flex-wrap gap-x-4">
              <span>{GAME_LABEL[open.game_type]}</span>
              <span>игроков {open.players_count}/{open.max_players} (старт от {open.min_players})</span>
              <span>взнос {open.entry_fee}</span><span>фонд {open.prize_pool}</span>
              <span>на ход: {formatTimeout(open.move_timeout_minutes)} (не сходил — поражение)</span>
              {open.winner_nickname && <span className="text-amber-300">🏆 {open.winner_nickname}</span>}
            </div>
            {open.status === 'registration' && (open.joined
              ? <Button variant="outline" onClick={() => act('leave_tournament', open.id)}>Отказаться от участия</Button>
              : <Button onClick={() => act('join_tournament', open.id)}>Участвовать{open.entry_fee ? ` (${open.entry_fee} фишек)` : ''}</Button>)}
            {myMatch?.room_id && <Button onClick={() => navigate(`/games/room/${myMatch.room_id}`)}>▶ Перейти к своей партии</Button>}
          </div>

          <div className="flex flex-wrap gap-2">
            {open.players?.map(p => (
              <span key={p.user_id} className={`px-2 py-0.5 rounded-full border border-slate-700 text-sm ${p.eliminated ? 'opacity-40 line-through' : ''}`}>{p.avatar_emoji} {p.nickname}</span>
            ))}
          </div>

          {rounds.map(r => (
            <div key={r}>
              <h3 className="font-semibold mb-1">Раунд {r}</h3>
              <div className="space-y-1">
                {open.matches!.filter(m => m.round === r).map(m => (
                  <div key={m.id} className="border border-slate-800 rounded px-3 py-1.5 text-sm flex justify-between">
                    <span>
                      <span className={m.winner_id === m.player1_id ? 'font-bold text-amber-300' : ''}>{m.p1_nickname}</span> vs{' '}
                      <span className={m.winner_id === m.player2_id ? 'font-bold text-amber-300' : ''}>{m.p2_nickname || 'проход без игры'}</span>
                    </span>
                    <span className="text-slate-500">{m.status === 'finished' ? 'сыграно' : 'идёт'}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </GameLayout>
  );
}
