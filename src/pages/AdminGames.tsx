import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminCall, Tournament, STATUS_LABEL, GAME_LABEL, formatTimeout } from '@/games/utils/gameTournaments';

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface RoomPlayer { user_id: number; nickname: string; avatar: string; side: string | null; chips: number | null }
interface MonitorRoom {
  id: number; game_type: string; room_name: string; status: string; max_players: number; is_private: boolean;
  created_at: string; updated_at: string; moves_count: number; chat_count: number;
  players: RoomPlayer[]; tournament_id: number | null; current_turn_user_id: number | null; winner_id: number | null;
}

const fmt = (s?: string | null) => (s ? new Date(s.replace(' ', 'T') + (s.includes('Z') ? '' : 'Z')).toLocaleString('ru-RU') : '—');
const ROOM_STATUS: Record<string, string> = { waiting: 'Ожидание', playing: 'Идёт игра', finished: 'Завершена' };

export default function AdminGames({ isAuthenticated, onLogout }: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!localStorage.getItem('adminSession') || !['admin', 'superadmin', 'moderator'].includes(role || '')) navigate('/admin');
  }, [navigate]);

  // ---- Мониторинг ----
  const [rooms, setRooms] = useState<MonitorRoom[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [recent, setRecent] = useState<{ id: number; nickname: string; avatar_emoji: string; games_played: number; games_won: number; last_login_at: string | null }[]>([]);
  const [statusFilter, setStatusFilter] = useState('live');
  const [gameFilter, setGameFilter] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [detail, setDetail] = useState<any | null>(null);

  const loadMonitor = useCallback(async () => {
    try {
      const q: Record<string, string> = { status: statusFilter };
      if (gameFilter) q.game_type = gameFilter;
      const d = await adminCall('monitor', { query: q });
      setRooms(d.rooms); setStats(d.stats); setRecent(d.recent_players);
    } catch (e) {
      toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' });
    } finally { setLoadingRooms(false); }
  }, [statusFilter, gameFilter, toast]);

  useEffect(() => {
    loadMonitor();
    const t = setInterval(loadMonitor, 10000);
    return () => clearInterval(t);
  }, [loadMonitor]);

  const openRoom = async (id: number) => {
    try { setDetail(await adminCall('room_detail', { query: { room_id: id } })); }
    catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  const closeRoom = async (id: number) => {
    if (!confirm('Принудительно завершить комнату?')) return;
    try {
      await adminCall('close_room', { body: { room_id: id } });
      setDetail(null); loadMonitor();
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  // ---- Турниры ----
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tDetail, setTDetail] = useState<Tournament | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', game_type: 'chess', min_players: 4, max_players: 16, entry_fee: 0, move_timeout_minutes: 1440, starts_at: '' });

  const loadTournaments = useCallback(async () => {
    try { setTournaments((await adminCall('admin_tournaments')).tournaments); }
    catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  }, [toast]);

  useEffect(() => {
    loadTournaments();
    const t = setInterval(loadTournaments, 15000);
    return () => clearInterval(t);
  }, [loadTournaments]);

  const openTournament = async (id: number) => {
    try { setTDetail(await adminCall('admin_tournament', { query: { tournament_id: id } })); }
    catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  const act = async (action: string, id: number, okMsg: string) => {
    try {
      await adminCall(action, { body: { tournament_id: id } });
      toast({ title: okMsg });
      await loadTournaments();
      if (tDetail?.id === id) openTournament(id);
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  const createTournament = async () => {
    try {
      await adminCall('create_tournament', { body: { ...form, starts_at: form.starts_at || null } });
      toast({ title: 'Турнир создан' });
      setShowForm(false);
      setForm({ name: '', description: '', game_type: 'chess', min_players: 4, max_players: 16, entry_fee: 0, move_timeout_minutes: 1440, starts_at: '' });
      loadTournaments();
    } catch (e) { toast({ title: 'Ошибка', description: (e as Error).message, variant: 'destructive' }); }
  };

  const rounds = tDetail?.matches ? Array.from(new Set(tDetail.matches.map(m => m.round))) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        <BackButton />
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Игры: мониторинг и турниры</h1>
          <p className="text-sm text-muted-foreground mb-4">Все комнаты игроков в реальном времени (обновление каждые 10 сек)</p>

          <Tabs defaultValue="monitor" className="space-y-4">
            <TabsList>
              <TabsTrigger value="monitor">Мониторинг игроков</TabsTrigger>
              <TabsTrigger value="tournaments">Турниры</TabsTrigger>
            </TabsList>

            <TabsContent value="monitor" className="space-y-4">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    ['Идут партии', stats.playing],
                    ['Ждут соперника', stats.waiting],
                    ['Игроков в комнатах', stats.players_in_rooms],
                    ['Онлайн (15 мин)', stats.online_recent],
                    ['Всего игроков', stats.total_players],
                  ].map(([l, v]) => (
                    <Card key={l as string}><CardContent className="p-4">
                      <div className="text-2xl font-bold">{v}</div>
                      <div className="text-xs text-muted-foreground">{l}</div>
                    </CardContent></Card>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                {[['live', 'Активные'], ['playing', 'Идёт игра'], ['waiting', 'Ожидание'], ['finished', 'Завершённые']].map(([v, l]) => (
                  <Button key={v} size="sm" variant={statusFilter === v ? 'default' : 'outline'} onClick={() => setStatusFilter(v)}>{l}</Button>
                ))}
                <span className="w-px h-6 bg-border mx-1" />
                {[['', 'Все игры'], ['chess', 'Шахматы'], ['checkers', 'Шашки'], ['poker', 'Покер']].map(([v, l]) => (
                  <Button key={v} size="sm" variant={gameFilter === v ? 'default' : 'outline'} onClick={() => setGameFilter(v)}>{l}</Button>
                ))}
                <Button size="sm" variant="ghost" onClick={loadMonitor}><Icon name="RefreshCw" size={14} /></Button>
              </div>

              {loadingRooms ? <p className="text-muted-foreground">Загрузка...</p> : rooms.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">Комнат нет</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {rooms.map(r => (
                    <Card key={r.id} className="cursor-pointer hover:border-primary/50" onClick={() => openRoom(r.id)}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold truncate">{r.room_name || `Комната #${r.id}`}</div>
                          <Badge variant={r.status === 'playing' ? 'default' : 'secondary'}>{ROOM_STATUS[r.status] || r.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                          <span>{GAME_LABEL[r.game_type]}</span>
                          {r.is_private && <span>🔒 приватная</span>}
                          {r.tournament_id && <span>🏆 турнир #{r.tournament_id}</span>}
                          <span>ходов: {r.moves_count}</span>
                          <span>чат: {r.chat_count}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {r.players.map(p => (
                            <span key={p.user_id} className={`text-sm px-2 py-0.5 rounded-full border ${r.current_turn_user_id === p.user_id && r.status === 'playing' ? 'border-primary bg-primary/10' : ''} ${r.winner_id === p.user_id ? 'border-green-500' : ''}`}>
                              {p.avatar} {p.nickname}{r.winner_id === p.user_id ? ' 🏆' : ''}
                            </span>
                          ))}
                          {r.players.length === 0 && <span className="text-sm text-muted-foreground">нет игроков</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">Активность: {fmt(r.updated_at)}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {recent.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 mt-4">Последние игроки</h3>
                  <div className="border rounded-lg divide-y">
                    {recent.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{p.avatar_emoji} {p.nickname}</span>
                        <span className="text-muted-foreground">партий {p.games_played} · побед {p.games_won} · вход {fmt(p.last_login_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tournaments" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">Олимпийская система (на вылет). Шахматы и шашки. Взнос списывается фишками, призовой фонд получает победитель.</p>
                <Button onClick={() => setShowForm(true)}><Icon name="Plus" size={16} className="mr-1" />Создать турнир</Button>
              </div>

              {tournaments.length === 0 ? <p className="text-muted-foreground py-8 text-center">Турниров пока нет</p> : (
                <div className="grid gap-3 md:grid-cols-2">
                  {tournaments.map(t => (
                    <Card key={t.id} className="cursor-pointer hover:border-primary/50" onClick={() => openTournament(t.id)}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between gap-2">
                          <div className="font-semibold truncate">🏆 {t.name}</div>
                          <Badge variant={t.status === 'active' ? 'default' : 'secondary'}>{STATUS_LABEL[t.status]}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3">
                          <span>{GAME_LABEL[t.game_type]}</span>
                          <span>игроков: {t.players_count}/{t.max_players} (мин. {t.min_players})</span>
                          <span>взнос: {t.entry_fee}</span>
                          <span>на ход: {formatTimeout(t.move_timeout_minutes)}</span>
                          <span>фонд: {t.prize_pool}</span>
                          {t.starts_at && <span>старт: {fmt(t.starts_at)}</span>}
                        </div>
                        {t.winner_nickname && <div className="text-sm">Победитель: <b>{t.winner_nickname}</b></div>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Детали комнаты */}
      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader><DialogTitle>{detail.room_name || `Комната #${detail.id}`} · {GAME_LABEL[detail.game_type]}</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge>{ROOM_STATUS[detail.status]}</Badge>
                  {detail.players.map((p: RoomPlayer) => (
                    <span key={p.user_id} className="px-2 py-0.5 rounded-full border">{(p as any).avatar_emoji || p.avatar} {p.nickname}{p.side ? ` (${p.side})` : ''}{p.chips != null ? ` · ${p.chips}` : ''}</span>
                  ))}
                </div>
                {detail.state?.fen && <div className="font-mono text-xs break-all bg-muted p-2 rounded">FEN: {detail.state.fen}</div>}
                {detail.game_type === 'poker' && detail.state && (
                  <div className="bg-muted p-2 rounded text-xs space-y-1">
                    <div>Стадия: {detail.state.stage} · банк: {detail.state.pot}</div>
                    <div>Общие карты: {(detail.state.community_cards || []).join(' ') || '—'}</div>
                    {Object.entries(detail.state.players || {}).map(([uid, pd]: [string, any]) => (
                      <div key={uid}>{detail.players.find((p: RoomPlayer) => String(p.user_id) === uid)?.nickname || uid}: {(pd.hole_cards || []).join(' ')}</div>
                    ))}
                  </div>
                )}
                <div>
                  <div className="font-semibold mb-1">Последние ходы ({detail.moves.length})</div>
                  <div className="max-h-40 overflow-y-auto border rounded divide-y">
                    {detail.moves.length === 0 && <div className="p-2 text-muted-foreground">Ходов нет</div>}
                    {detail.moves.map((m: any) => (
                      <div key={m.move_number} className="px-2 py-1 flex justify-between gap-2">
                        <span>#{m.move_number} {m.nickname}</span>
                        <span className="font-mono text-xs truncate">{JSON.stringify(m.move_data)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Чат</div>
                  <div className="max-h-40 overflow-y-auto border rounded divide-y">
                    {detail.chat.length === 0 && <div className="p-2 text-muted-foreground">Сообщений нет</div>}
                    {detail.chat.map((c: any, i: number) => (
                      <div key={i} className="px-2 py-1"><b>{c.nickname}:</b> {c.message}</div>
                    ))}
                  </div>
                </div>
                {detail.status !== 'finished' && (
                  <Button variant="destructive" size="sm" onClick={() => closeRoom(detail.id)}>Завершить комнату принудительно</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Создание турнира */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Новый турнир</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Название" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={100} />
            <Textarea placeholder="Описание / правила" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            <div className="flex gap-2">
              {[['chess', 'Шахматы'], ['checkers', 'Шашки']].map(([v, l]) => (
                <Button key={v} type="button" size="sm" variant={form.game_type === v ? 'default' : 'outline'} onClick={() => setForm({ ...form, game_type: v })}>{l}</Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs">Мин. игроков<Input type="number" min={2} value={form.min_players} onChange={e => setForm({ ...form, min_players: +e.target.value })} /></label>
              <label className="text-xs">Макс. игроков<Input type="number" max={64} value={form.max_players} onChange={e => setForm({ ...form, max_players: +e.target.value })} /></label>
              <label className="text-xs">Взнос (фишки)<Input type="number" min={0} value={form.entry_fee} onChange={e => setForm({ ...form, entry_fee: +e.target.value })} /></label>
            </div>
            <label className="text-xs block">Время на ход (минут; 1440 = сутки). Не сходил вовремя — поражение
              <Input type="number" min={5} max={10080} value={form.move_timeout_minutes} onChange={e => setForm({ ...form, move_timeout_minutes: +e.target.value })} /></label>
            <label className="text-xs block">Дата начала (информационно)<Input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></label>
            <Button className="w-full" onClick={createTournament}>Создать</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Детали турнира */}
      <Dialog open={!!tDetail} onOpenChange={o => !o && setTDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {tDetail && (
            <>
              <DialogHeader><DialogTitle>🏆 {tDetail.name} · {STATUS_LABEL[tDetail.status]}</DialogTitle></DialogHeader>
              <div className="space-y-4 text-sm">
                {tDetail.description && <p className="text-muted-foreground">{tDetail.description}</p>}
                <div className="flex flex-wrap gap-x-4 text-muted-foreground">
                  <span>{GAME_LABEL[tDetail.game_type]}</span>
                  <span>игроков {tDetail.players_count}/{tDetail.max_players}</span>
                  <span>призовой фонд: {tDetail.prize_pool}</span>
                  {tDetail.winner_nickname && <span className="text-foreground font-semibold">Победитель: {tDetail.winner_nickname}</span>}
                </div>
                <div>
                  <div className="font-semibold mb-1">Участники</div>
                  <div className="flex flex-wrap gap-2">
                    {tDetail.players?.map(p => (
                      <span key={p.user_id} className={`px-2 py-0.5 rounded-full border ${p.eliminated ? 'opacity-50 line-through' : ''}`}>{p.avatar_emoji} {p.nickname}</span>
                    ))}
                    {!tDetail.players?.length && <span className="text-muted-foreground">Пока никого</span>}
                  </div>
                </div>
                {rounds.map(r => (
                  <div key={r}>
                    <div className="font-semibold mb-1">Раунд {r}</div>
                    <div className="space-y-1">
                      {tDetail.matches!.filter(m => m.round === r).map(m => (
                        <div key={m.id} className="flex items-center justify-between border rounded px-2 py-1">
                          <span>
                            <span className={m.winner_id === m.player1_id ? 'font-bold' : ''}>{m.p1_nickname}</span>
                            {' vs '}
                            <span className={m.winner_id === m.player2_id ? 'font-bold' : ''}>{m.p2_nickname || 'проход без игры'}</span>
                          </span>
                          {m.room_id && m.status === 'playing' && <Button size="sm" variant="outline" onClick={() => openRoom(m.room_id!)}>Смотреть</Button>}
                          {m.status === 'finished' && <Badge variant="secondary">сыграно</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2">
                  {tDetail.status === 'registration' && <Button onClick={() => act('start_tournament', tDetail.id, 'Турнир запущен')}>Запустить турнир</Button>}
                  {['registration', 'active'].includes(tDetail.status) && (
                    <Button variant="destructive" onClick={() => confirm('Отменить турнир? Взносы будут возвращены.') && act('cancel_tournament', tDetail.id, 'Турнир отменён')}>Отменить</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
