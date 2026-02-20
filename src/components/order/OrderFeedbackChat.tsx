import { useState, useEffect, useRef, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { ordersAPI } from '@/services/api';
import { getSession } from '@/utils/auth';

interface OrderMessage {
  id: string;
  orderId: string;
  senderId: number;
  senderName: string;
  senderType: 'buyer' | 'seller';
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface OrderFeedbackChatProps {
  orderId: string;
  orderStatus: string;
  isBuyer: boolean;
  isRequest?: boolean;
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const W = window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    if (!audioCtx) {
      audioCtx = new (W.AudioContext || W.webkitAudioContext!)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => playNotificationSound());
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1046, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore
  }
}

export default function OrderFeedbackChat({ orderId, orderStatus, isBuyer, isRequest }: OrderFeedbackChatProps) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const isFirstLoad = useRef(true);

  const getSenderRole = (senderType: 'buyer' | 'seller') => {
    if (isRequest) {
      return senderType === 'buyer' ? 'Заказчик' : 'Исполнитель';
    }
    return senderType === 'buyer' ? 'Покупатель' : 'Продавец';
  };

  const loadMessages = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoadingMessages(true);
      const data = await ordersAPI.getMessagesByOrder(orderId);
      const fetched = data.messages || [];

      if (!isFirstLoad.current && fetched.length > prevCountRef.current) {
        const lastMsg = fetched[fetched.length - 1];
        const isFromOther = isBuyer ? lastMsg.senderType !== 'buyer' : lastMsg.senderType !== 'seller';
        if (isFromOther && localStorage.getItem('soundNotificationsEnabled') !== 'false') {
          playNotificationSound();
        }
      }

      prevCountRef.current = fetched.length;
      isFirstLoad.current = false;
      setMessages(fetched);
    } catch (e) {
      console.error('Error loading messages:', e);
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  }, [orderId, isBuyer]);

  useEffect(() => {
    if (orderStatus === 'accepted') {
      isFirstLoad.current = true;
      loadMessages();
    }
  }, [orderId, orderStatus, loadMessages]);

  useEffect(() => {
    if (orderStatus !== 'accepted') return;
    const interval = setInterval(() => loadMessages(true), 5000);
    return () => clearInterval(interval);
  }, [orderId, orderStatus, loadMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    const user = getSession();
    if (!user?.id) return;

    try {
      setIsSending(true);
      await ordersAPI.createMessage({
        orderId,
        senderId: user.id,
        senderType: isBuyer ? 'buyer' : 'seller',
        message: newMessage.trim(),
      });
      setNewMessage('');
      await loadMessages(true);
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (orderStatus !== 'accepted') {
    return null;
  }

  return (
    <>
      <Separator />
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon name="MessageSquare" className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm">Обратная связь</h3>
          </div>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground">{messages.length}</span>
          )}
        </div>

        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-4">
            <Icon name="Loader2" className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-2 max-h-[200px] overflow-y-auto mb-3 pr-1">
            {messages.map((msg) => {
              const isMe = isBuyer ? msg.senderType === 'buyer' : msg.senderType === 'seller';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {!isMe && (
                      <div className="mb-0.5">
                        <p className="text-xs font-semibold opacity-80">{msg.senderName}</p>
                        <p className="text-[10px] opacity-60">{getSenderRole(msg.senderType)}</p>
                      </div>
                    )}
                    {isMe && (
                      <p className="text-[10px] opacity-60 mb-0.5 text-right">{getSenderRole(msg.senderType)}</p>
                    )}
                    <p className="whitespace-pre-line break-words">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">Здесь можно уточнить детали, задать вопрос или оставить комментарий</p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Написать сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={unlockAudio}
            onTouchStart={unlockAudio}
            disabled={isSending}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={handleSendMessage}
            onTouchStart={unlockAudio}
            disabled={!newMessage.trim() || isSending}
            className="flex-shrink-0 px-3"
          >
            {isSending ? (
              <Icon name="Loader2" className="h-4 w-4 animate-spin" />
            ) : (
              <Icon name="Send" className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
