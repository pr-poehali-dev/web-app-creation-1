import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import func2url from '../../../backend/func2url.json';

const API_URL = func2url['auctions-list'];

interface AuctionCompletionFormProps {
  auctionId: string;
  winnerName: string;
  winnerId: string;
  winningBid: number;
  isWinner: boolean;
  isSeller: boolean;
  sellerName?: string;
}

interface ChatMessage {
  id: number;
  senderId: number;
  senderName: string;
  message: string;
  createdAt: string;
}

function AuctionChat({ auctionId, currentUserId, sellerId, winnerId }: {
  auctionId: string;
  currentUserId: string;
  sellerId: number;
  winnerId: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId },
        body: JSON.stringify({ action: 'get_messages', auctionId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [auctionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId },
        body: JSON.stringify({ action: 'send_message', auctionId, message: text.trim() }),
      });
      if (res.ok) {
        setText('');
        await load();
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось отправить', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Нет соединения', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-2 p-3 bg-muted/30 rounded-lg mb-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Напишите первое сообщение</p>
        ) : (
          messages.map(msg => {
            const isMe = String(msg.senderId) === String(currentUserId);
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                  {!isMe && <p className="text-xs font-semibold mb-0.5 opacity-70">{msg.senderName}</p>}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'opacity-60' : 'text-muted-foreground'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Написать сообщение..."
          className="flex-1"
        />
        <Button onClick={send} disabled={!text.trim() || isSending} size="icon">
          {isSending
            ? <Icon name="Loader2" className="h-4 w-4 animate-spin" />
            : <Icon name="Send" className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function AuctionCompletionForm({
  auctionId,
  winnerName,
  winnerId,
  winningBid,
  isWinner,
  isSeller,
  sellerName,
}: AuctionCompletionFormProps) {

  const [contactsReceived, setContactsReceived] = useState<Record<string, string> | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [sellerId, setSellerId] = useState<number | null>(null);

  const currentUserId = localStorage.getItem('userId') || '';

  useEffect(() => {
    const fetchContacts = async () => {
      if (!currentUserId || document.hidden) return;
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId },
          body: JSON.stringify({ action: 'get', auctionId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.contacts) setContactsReceived(data.contacts);
          if (data.sellerId) setSellerId(data.sellerId);
        }
      } catch { /* ignore */ }
    };

    fetchContacts();
  }, [auctionId, currentUserId]);

  if (!isWinner && !isSeller) return null;

  return (
    <>
      {/* Поздравление победителю */}
      {isWinner && (
        <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/20">
          <CardContent className="py-6">
            <div className="text-center space-y-3">
              <div className="text-5xl">🏆</div>
              <div>
                <h2 className="text-xl font-bold text-yellow-700 dark:text-yellow-400 mb-1">
                  Поздравляем! Вы победили в аукционе!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ваша победная ставка: <span className="font-bold text-foreground">{winningBid.toLocaleString('ru-RU')} ₽</span>
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                <Button
                  size="lg"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                  onClick={() => setChatOpen(true)}
                >
                  <Icon name="MessageCircle" className="h-5 w-5 mr-2" />
                  Связаться с продавцом
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-yellow-400 text-yellow-700"
                  onClick={() => setChatOpen(true)}
                >
                  <Icon name="ShoppingBag" className="h-5 w-5 mr-2" />
                  Забрать товар
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Блок для продавца */}
      {isSeller && (
        <Card className="border-primary/50">
          <CardHeader className="py-3 md:py-4">
            <CardTitle className="text-sm md:text-base flex items-center gap-2">
              <Icon name="Trophy" className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
              Аукцион завершён — победитель определён
            </CardTitle>
          </CardHeader>
          <CardContent className="py-3 space-y-3">
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground">Победитель: <span className="font-semibold text-foreground">{winnerName}</span></p>
              <p className="text-muted-foreground">Сумма: <span className="font-bold text-green-700">{winningBid.toLocaleString('ru-RU')} ₽</span></p>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setChatOpen(true)}
            >
              <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
              Написать победителю
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Блок контактов — показывается сразу из профиля */}
      {contactsReceived && (
        <Card className="border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Icon name="User" className="h-4 w-4 text-blue-500" />
              {isWinner ? 'Контакты продавца' : 'Контакты победителя'}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2 space-y-2">
            {contactsReceived.name && (
              <div className="flex items-center gap-2 text-sm font-medium">
                <Icon name="User" className="h-4 w-4 text-muted-foreground" />
                {contactsReceived.name}
              </div>
            )}
            {contactsReceived.phone && (
              <a href={`tel:${contactsReceived.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Icon name="Phone" className="h-4 w-4 text-muted-foreground" />
                {contactsReceived.phone}
              </a>
            )}
            {contactsReceived.email && (
              <a href={`mailto:${contactsReceived.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <Icon name="Mail" className="h-4 w-4 text-muted-foreground" />
                {contactsReceived.email}
              </a>
            )}
            {!contactsReceived.phone && !contactsReceived.email && (
              <p className="text-xs text-muted-foreground">Контактные данные не указаны в профиле</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Контакты загружаются */}
      {!contactsReceived && (
        <Card className="border-muted">
          <CardContent className="py-4 text-center">
            <Icon name="Loader2" className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
          </CardContent>
        </Card>
      )}

      {/* Модальный чат */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="MessageCircle" className="h-5 w-5 text-primary" />
              {isWinner ? `Чат с продавцом` : `Чат с победителем — ${winnerName}`}
            </DialogTitle>
          </DialogHeader>

          {/* Контакты в шапке чата */}
          {contactsReceived && (
            <div className="bg-muted rounded-lg px-3 py-2 text-sm flex flex-wrap gap-3 mb-1">
              {contactsReceived.phone && (
                <a href={`tel:${contactsReceived.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Icon name="Phone" className="h-3.5 w-3.5" />{contactsReceived.phone}
                </a>
              )}
              {contactsReceived.email && (
                <a href={`mailto:${contactsReceived.email}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Icon name="Mail" className="h-3.5 w-3.5" />{contactsReceived.email}
                </a>
              )}
            </div>
          )}

          <AuctionChat
            auctionId={auctionId}
            currentUserId={currentUserId}
            sellerId={sellerId || 0}
            winnerId={winnerId}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}