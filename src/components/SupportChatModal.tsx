import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const SUPPORT_API = 'https://functions.poehali.dev/290e9899-6b8d-4974-bcea-12fafbb54fe5';

interface Message {
  id: number;
  is_admin: boolean;
  message: string;
  author_name: string;
  created_at: string;
}

interface Ticket {
  id: number;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  unread_admin: number;
}

interface SupportChatModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onUnreadChange?: (count: number) => void;
}

export default function SupportChatModal({ open, onClose, userId, onUnreadChange }: SupportChatModalProps) {
  const { toast } = useToast();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch(`${SUPPORT_API}?action=tickets`, {
        headers: { 'X-User-Id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        const list: Ticket[] = data.tickets || [];
        setTickets(list);
        const total = list.reduce((sum, t) => sum + Number(t.unread_admin || 0), 0);
        onUnreadChange?.(total);
      }
    } catch { /* silent */ }
    finally { setLoadingTickets(false); }
  }, [userId, onUnreadChange]);

  const markRead = useCallback(async (ticketId: number) => {
    try {
      await fetch(`${SUPPORT_API}?action=mark_read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ ticketId }),
      });
      setTickets(prev => {
        const updated = prev.map(t => t.id === ticketId ? { ...t, unread_admin: 0 } : t);
        const total = updated.reduce((sum, t) => sum + Number(t.unread_admin || 0), 0);
        onUnreadChange?.(total);
        return updated;
      });
    } catch { /* silent */ }
  }, [userId, onUnreadChange]);

  const loadMessages = useCallback(async (ticketId: number) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`${SUPPORT_API}?action=messages&ticketId=${ticketId}`, {
        headers: { 'X-User-Id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* silent */ }
    finally { setLoadingMessages(false); }
  }, [userId]);

  useEffect(() => {
    if (open) loadTickets();
  }, [open, loadTickets]);

  useEffect(() => {
    if (!activeTicket) return;
    loadMessages(activeTicket.id);
    if (Number(activeTicket.unread_admin) > 0) markRead(activeTicket.id);
  }, [activeTicket, loadMessages, markRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeTicket) return;
    const handleSW = (e: MessageEvent) => {
      if (e.data?.type === 'REFRESH_UNREAD') loadMessages(activeTicket.id);
    };
    navigator.serviceWorker?.addEventListener('message', handleSW);
    return () => navigator.serviceWorker?.removeEventListener('message', handleSW);
  }, [activeTicket, loadMessages]);

  const handleClose = () => {
    setActiveTicket(null);
    setMessages([]);
    setShowNewTicket(false);
    setNewMessage('');
    setSubject('');
    onClose();
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const body: Record<string, string | number> = { message: newMessage.trim() };
      if (activeTicket) {
        body.ticketId = activeTicket.id;
      } else {
        body.subject = subject.trim() || 'Обращение в поддержку';
      }
      const res = await fetch(`${SUPPORT_API}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setNewMessage('');
        setShowNewTicket(false);
        await loadTickets();
        if (!activeTicket) {
          const newTicket: Ticket = {
            id: data.ticketId,
            subject: body.subject as string,
            status: 'open',
            created_at: data.createdAt,
            updated_at: data.createdAt,
            unread_admin: 0,
          };
          setActiveTicket(newTicket);
        } else {
          await loadMessages(activeTicket.id);
        }
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const totalUnread = tickets.reduce((sum, t) => sum + Number(t.unread_admin || 0), 0);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg w-full p-0 gap-0 overflow-hidden" style={{ maxHeight: '85vh' }}>
        <DialogHeader className="px-4 py-3 border-b flex-row items-center gap-3 space-y-0">
          <div className="bg-primary/10 p-2 rounded-lg shrink-0">
            <Icon name="MessageSquare" className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-base font-semibold leading-tight">
              {activeTicket ? activeTicket.subject : 'Чат с поддержкой'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">Пн–Пт 9:00–18:00</p>
          </div>
          {!activeTicket && tickets.length > 0 && !showNewTicket && (
            <Button size="sm" variant="outline" onClick={() => setShowNewTicket(true)} className="shrink-0">
              <Icon name="Plus" size={14} className="mr-1" />
              Новое
            </Button>
          )}
        </DialogHeader>

        {/* Список тикетов */}
        {!activeTicket && !showNewTicket && (
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 64px)' }}>
            {loadingTickets ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Icon name="MessageCircle" className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">Обращений пока нет</p>
                <Button onClick={() => setShowNewTicket(true)}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Написать в поддержку
                </Button>
              </div>
            ) : (
              <div className="p-3 space-y-1.5">
                {totalUnread > 0 && (
                  <p className="text-xs text-muted-foreground px-1 mb-2">
                    {totalUnread} непрочитанных ответа
                  </p>
                )}
                {tickets.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTicket(t)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border hover:bg-accent transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatTime(t.updated_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {Number(t.unread_admin) > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                          {t.unread_admin}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${t.status === 'open' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                        {t.status === 'open' ? 'Открыто' : 'Закрыто'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Форма нового обращения */}
        {!activeTicket && showNewTicket && (
          <div className="p-4 space-y-3">
            <button
              onClick={() => setShowNewTicket(false)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Icon name="ChevronLeft" size={14} />
              Назад
            </button>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Тема обращения"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="Опишите вашу проблему или вопрос..."
              rows={4}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
            />
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="w-full">
              {sending ? 'Отправка...' : 'Отправить обращение'}
            </Button>
          </div>
        )}

        {/* Активный чат */}
        {activeTicket && (
          <div className="flex flex-col" style={{ height: 'calc(85vh - 64px)' }}>
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 shrink-0">
              <button
                onClick={() => { setActiveTicket(null); setMessages([]); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Icon name="ChevronLeft" size={18} />
              </button>
              <span className="text-sm font-medium flex-1 truncate">{activeTicket.subject}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${activeTicket.status === 'open' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                {activeTicket.status === 'open' ? 'Открыто' : 'Закрыто'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Нет сообщений</p>
              ) : messages.map(m => (
                <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.is_admin
                    ? 'bg-muted text-foreground rounded-tl-sm'
                    : 'bg-primary text-primary-foreground rounded-tr-sm'}`}>
                    {m.is_admin && <p className="text-xs font-medium mb-1 opacity-70">{m.author_name}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.message}</p>
                    <p className={`text-xs mt-1 ${m.is_admin ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>
                      {formatTime(m.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {activeTicket.status === 'open' ? (
              <div className="p-3 border-t flex gap-2 shrink-0">
                <textarea
                  className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="Ваше сообщение..."
                  rows={2}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <Button size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()} className="h-auto self-end">
                  <Icon name="Send" size={16} />
                </Button>
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-3 border-t shrink-0">Обращение закрыто</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}