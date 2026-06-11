import { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/icon';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';

const SUPPORT_API = 'https://functions.poehali.dev/290e9899-6b8d-4974-bcea-12fafbb54fe5';
const SETTINGS_API = 'https://functions.poehali.dev/6c65e3c6-d621-44fc-99da-cd570027fae7';

interface SupportProps {
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
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  unread_admin: number;
}

export default function Support({ isAuthenticated, onLogout }: SupportProps) {
  useScrollToTop();
  const { toast } = useToast();
  const session = getSession();
  const userId = session?.id ? String(session.id) : null;

  const supportEmail = 'doydum-invest@mail.ru';
  const [phoneContactMethod, setPhoneContactMethod] = useState<'whatsapp' | 'telegram' | 'call'>('call');
  const [contacts, setContacts] = useState({ phone: '+7 (984) 101-73-55', whatsapp: '', telegram: '' });

  useEffect(() => {
    const keys = ['support_phone', 'support_whatsapp', 'support_telegram'];
    Promise.all(keys.map(k => fetch(`${SETTINGS_API}?key=${k}`).then(r => r.ok ? r.json() : null).catch(() => null)))
      .then(([phone, whatsapp, telegram]) => {
        setContacts({
          phone: phone?.setting_value || '+7 (984) 101-73-55',
          whatsapp: whatsapp?.setting_value || '',
          telegram: telegram?.setting_value || '',
        });
      });
  }, []);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${SUPPORT_API}?action=tickets`, {
        headers: { 'X-User-Id': userId }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch { /* silent */ }
  }, [userId]);

  const loadMessages = useCallback(async (ticketId: number) => {
    if (!userId) return;
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
    if (isAuthenticated) loadTickets();
  }, [isAuthenticated, loadTickets]);

  useEffect(() => {
    if (activeTicket) loadMessages(activeTicket.id);
  }, [activeTicket, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Слушаем push — обновляем сообщения при ответе поддержки
  useEffect(() => {
    if (!activeTicket) return;
    const handleSW = (e: MessageEvent) => {
      if (e.data?.type === 'REFRESH_UNREAD') loadMessages(activeTicket.id);
    };
    navigator.serviceWorker?.addEventListener('message', handleSW);
    return () => navigator.serviceWorker?.removeEventListener('message', handleSW);
  }, [activeTicket, loadMessages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId) return;
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
          const newTicket = { id: data.ticketId, subject: body.subject as string,
            status: 'open', created_at: data.createdAt, updated_at: data.createdAt, unread_admin: 0 };
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Поддержка"
        description="Служба поддержки ЕРТТП. Задайте вопрос, сообщите о проблеме или получите помощь по работе с платформой."
        keywords="поддержка ЕРТТП, помощь торговая площадка, связаться с поддержкой"
        canonical="/support"
      />
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-4 md:py-6 flex-1">
        <BackButton />
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6">Поддержка</h1>

          {/* Чат с поддержкой — только для авторизованных */}
          {isAuthenticated && userId && (
            <div className="bg-card border rounded-lg mb-4 md:mb-5 overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Icon name="MessageSquare" className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Чат с поддержкой</h3>
                  <p className="text-xs text-muted-foreground">Отвечаем в рабочее время Пн-Пт 9:00-18:00</p>
                </div>
                {!activeTicket && tickets.length > 0 && (
                  <Button size="sm" variant="outline" onClick={() => setShowNewTicket(true)}>
                    <Icon name="Plus" size={14} className="mr-1" />
                    Новое
                  </Button>
                )}
              </div>

              {/* Список тикетов */}
              {!activeTicket && !showNewTicket && (
                <div className="p-4">
                  {tickets.length === 0 ? (
                    <div className="text-center py-6">
                      <Icon name="MessageCircle" className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm mb-4">Обращений пока нет</p>
                      <Button onClick={() => setShowNewTicket(true)}>
                        <Icon name="Plus" size={16} className="mr-2" />
                        Написать в поддержку
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tickets.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setActiveTicket(t)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors flex items-center justify-between gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{t.subject}</p>
                            <p className="text-xs text-muted-foreground">{formatTime(t.updated_at)}</p>
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
              {(showNewTicket || (tickets.length === 0 && !activeTicket)) && !activeTicket && (
                <div className="p-4 space-y-3">
                  {showNewTicket && (
                    <button onClick={() => setShowNewTicket(false)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <Icon name="ChevronLeft" size={14} />
                      Назад
                    </button>
                  )}
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
                <div className="flex flex-col" style={{ height: '420px' }}>
                  <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
                    <button onClick={() => { setActiveTicket(null); setMessages([]); }}
                      className="text-muted-foreground hover:text-foreground">
                      <Icon name="ChevronLeft" size={18} />
                    </button>
                    <span className="text-sm font-medium flex-1 truncate">{activeTicket.subject}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${activeTicket.status === 'open' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
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

                  {activeTicket.status === 'open' && (
                    <div className="p-3 border-t flex gap-2">
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
                  )}
                  {activeTicket.status === 'closed' && (
                    <p className="text-center text-sm text-muted-foreground py-3 border-t">Обращение закрыто</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4 md:space-y-5">
            {/* Email */}
            <div className="bg-card border rounded-lg p-4 md:p-5">
              <div className="flex items-start gap-3 md:gap-4">
                <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg">
                  <Icon name="Mail" className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">Электронная почта</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-2">
                    Отправьте нам сообщение, и мы ответим в ближайшее время
                  </p>
                  <a href={`mailto:${supportEmail}`} className="text-primary hover:underline inline-flex items-center gap-1.5 font-medium">
                    {supportEmail}
                  </a>
                </div>
              </div>
            </div>

            {/* Телефон */}
            {contacts.phone && (
              <div className="bg-card border rounded-lg p-4 md:p-5">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="bg-primary/10 p-2 md:p-2.5 rounded-lg">
                    <Icon name={phoneContactMethod === 'whatsapp' ? 'MessageSquare' : phoneContactMethod === 'telegram' ? 'MessageCircle' : 'Phone'}
                      className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">Телефон горячей линии</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-3">Свяжитесь с нами удобным способом</p>
                    <div className="mb-3">
                      <p className="text-primary font-medium mb-2">{contacts.phone}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a href={phoneContactMethod === 'call' ? `tel:${contacts.phone.replace(/[^0-9+]/g, '')}` : '#'}
                        onClick={e => { if (phoneContactMethod !== 'call') { e.preventDefault(); setPhoneContactMethod('call'); } }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${phoneContactMethod === 'call' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent border-border'}`}>
                        <Icon name="Phone" className="h-4 w-4" />
                        <span className="text-sm font-medium">Позвонить</span>
                      </a>
                      {contacts.whatsapp && (
                        <a href={phoneContactMethod === 'whatsapp' ? contacts.whatsapp : '#'}
                          target={phoneContactMethod === 'whatsapp' ? '_blank' : undefined}
                          rel={phoneContactMethod === 'whatsapp' ? 'noopener noreferrer' : undefined}
                          onClick={e => { if (phoneContactMethod !== 'whatsapp') { e.preventDefault(); setPhoneContactMethod('whatsapp'); setTimeout(() => window.open(contacts.whatsapp, '_blank'), 100); } }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${phoneContactMethod === 'whatsapp' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent border-border'}`}>
                          <Icon name="MessageSquare" className="h-4 w-4" />
                          <span className="text-sm font-medium">WhatsApp</span>
                        </a>
                      )}
                      {contacts.telegram && (
                        <a href={phoneContactMethod === 'telegram' ? contacts.telegram : '#'}
                          target={phoneContactMethod === 'telegram' ? '_blank' : undefined}
                          rel={phoneContactMethod === 'telegram' ? 'noopener noreferrer' : undefined}
                          onClick={e => { if (phoneContactMethod !== 'telegram') { e.preventDefault(); setPhoneContactMethod('telegram'); setTimeout(() => window.open(contacts.telegram, '_blank'), 100); } }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${phoneContactMethod === 'telegram' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent border-border'}`}>
                          <Icon name="MessageCircle" className="h-4 w-4" />
                          <span className="text-sm font-medium">Telegram</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}