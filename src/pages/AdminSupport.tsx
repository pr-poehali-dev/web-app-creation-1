import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const SUPPORT_API = 'https://functions.poehali.dev/290e9899-6b8d-4974-bcea-12fafbb54fe5';

interface AdminSupportProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Message {
  id: number;
  is_admin: boolean;
  message: string;
  author_name: string;
  created_at: string;
}

interface Ticket {
  id: number;
  user_id: number;
  user_name: string;
  phone: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  msg_count: number;
  last_message: string;
  unread_user: number;
}

export default function AdminSupport({ isAuthenticated, onLogout }: AdminSupportProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const adminId = localStorage.getItem('userId') || '';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('open');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    const userRole = localStorage.getItem('userRole');
    if (!adminSession || !['admin', 'superadmin', 'moderator'].includes(userRole || '')) {
      navigate('/admin');
    }
  }, [navigate]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const filter = statusFilter === 'all' ? '' : `&status=${statusFilter}`;
      const res = await fetch(`${SUPPORT_API}?action=admin_tickets${filter}`, {
        headers: { 'X-Admin-Id': adminId }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [adminId, statusFilter]);

  const loadMessages = useCallback(async (ticketId: number) => {
    try {
      const res = await fetch(`${SUPPORT_API}?action=messages&ticketId=${ticketId}`, {
        headers: { 'X-Admin-Id': adminId }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* silent */ }
  }, [adminId]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  useEffect(() => {
    if (activeTicket) loadMessages(activeTicket.id);
  }, [activeTicket, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async () => {
    if (!newMessage.trim() || !activeTicket) return;
    setSending(true);
    try {
      const res = await fetch(`${SUPPORT_API}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Id': adminId },
        body: JSON.stringify({ message: newMessage.trim(), ticketId: activeTicket.id })
      });
      if (res.ok) {
        setNewMessage('');
        await loadMessages(activeTicket.id);
        await loadTickets();
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить', variant: 'destructive' });
    } finally { setSending(false); }
  };

  const closeTicket = async (ticketId: number) => {
    try {
      await fetch(`${SUPPORT_API}?action=close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Id': adminId },
        body: JSON.stringify({ ticketId })
      });
      setActiveTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      await loadTickets();
    } catch { /* silent */ }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const openCount = tickets.filter(t => t.status === 'open').length;
  const unreadCount = tickets.reduce((s, t) => s + Number(t.unread_user || 0), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        <BackButton />
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Обращения в поддержку</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Открытых: {openCount}
                {unreadCount > 0 && <span className="ml-2 text-primary font-medium">· Новых: {unreadCount}</span>}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadTickets}>
              <Icon name="RefreshCw" size={14} className="mr-1" />
              Обновить
            </Button>
          </div>

          <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
            {/* Список тикетов */}
            <div className="w-80 shrink-0 flex flex-col border rounded-lg overflow-hidden bg-card">
              {/* Фильтр */}
              <div className="flex border-b">
                {(['open', 'closed', 'all'] as const).map(f => (
                  <button key={f} onClick={() => setStatusFilter(f)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${statusFilter === f ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}>
                    {f === 'open' ? 'Открытые' : f === 'closed' ? 'Закрытые' : 'Все'}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : tickets.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-10">Нет обращений</p>
                ) : tickets.map(t => (
                  <button key={t.id} onClick={() => setActiveTicket(t)}
                    className={`w-full text-left p-3 border-b hover:bg-accent transition-colors ${activeTicket?.id === t.id ? 'bg-accent' : ''}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-medium text-sm truncate flex-1">{t.user_name}</span>
                      {Number(t.unread_user) > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center shrink-0">
                          {t.unread_user}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1">{t.subject}</p>
                    {t.last_message && (
                      <p className="text-xs text-muted-foreground truncate">{t.last_message}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{formatTime(t.updated_at)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Область чата */}
            <div className="flex-1 border rounded-lg overflow-hidden bg-card flex flex-col">
              {!activeTicket ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Icon name="MessageSquare" className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Выберите обращение</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Шапка чата */}
                  <div className="p-3 border-b flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activeTicket.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {activeTicket.user_name}
                        {activeTicket.phone && <span className="ml-2">{activeTicket.phone}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${activeTicket.status === 'open' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                        {activeTicket.status === 'open' ? 'Открыто' : 'Закрыто'}
                      </span>
                      {activeTicket.status === 'open' && (
                        <Button size="sm" variant="outline" onClick={() => closeTicket(activeTicket.id)}>
                          Закрыть
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Сообщения */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map(m => (
                      <div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.is_admin
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-muted text-foreground rounded-tl-sm'}`}>
                          {!m.is_admin && <p className="text-xs font-medium mb-1 opacity-70">{m.author_name}</p>}
                          <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          <p className={`text-xs mt-1 ${m.is_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {formatTime(m.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Ввод ответа */}
                  {activeTicket.status === 'open' ? (
                    <div className="p-3 border-t flex gap-2">
                      <textarea
                        className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        placeholder="Ответ пользователю..."
                        rows={2}
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                      />
                      <Button size="icon" onClick={sendReply} disabled={sending || !newMessage.trim()} className="h-auto self-end">
                        <Icon name="Send" size={16} />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-3 border-t">Обращение закрыто</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
