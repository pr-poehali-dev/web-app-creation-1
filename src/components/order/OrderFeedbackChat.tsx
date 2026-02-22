import { useState, useEffect, useRef, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { ordersAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';

interface MessageAttachment {
  url: string;
  name: string;
  type: string;
}

interface OrderMessage {
  id: string;
  orderId: string;
  senderId: number;
  senderName: string;
  senderType: 'buyer' | 'seller';
  message: string;
  isRead: boolean;
  attachments?: MessageAttachment[];
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
  const { toast } = useToast();
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const prevOrderStatus = useRef(orderStatus);
  const [showHistory, setShowHistory] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const isFirstLoad = useRef(true);
  const isAtBottomRef = useRef(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  const handleMessagesScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 60;
    if (isAtBottomRef.current) setHasNewMessages(false);
  };

  const scrollToBottom = (force = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (isAtBottomRef.current || force) {
      container.scrollTop = container.scrollHeight;
      setHasNewMessages(false);
      isAtBottomRef.current = true;
    }
  };

  const getSenderRole = (senderType: 'buyer' | 'seller') => {
    if (isRequest) {
      // В откликах buyer_id = Исполнитель, seller_id = Заказчик (инверсия в БД)
      return senderType === 'buyer' ? 'Исполнитель' : 'Заказчик';
    }
    return senderType === 'buyer' ? 'Покупатель' : 'Продавец';
  };

  const loadMessages = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoadingMessages(true);
      const data = await ordersAPI.getMessagesByOrder(orderId);
      const fetched = (data.messages || []).map((m: Record<string, unknown>) => ({
        ...m,
        senderType: m.senderType || m.sender_type,
        senderName: m.senderName || m.sender_name,
      })) as OrderMessage[];

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

  // Уведомление при завершении заказа пока открыт чат
  useEffect(() => {
    if (prevOrderStatus.current === 'accepted' && orderStatus === 'completed') {
      toast({
        title: 'Заказ завершён',
        description: 'Контрагент завершил заказ. Отправка сообщений недоступна.',
      });
    }
    prevOrderStatus.current = orderStatus;
  }, [orderStatus, toast]);

  useEffect(() => {
    if (orderStatus === 'accepted' || orderStatus === 'completed') {
      isFirstLoad.current = true;
      initialScrollDone.current = false;
      prevMessagesLengthRef.current = 0;
      isAtBottomRef.current = true;
      setHasNewMessages(false);
      loadMessages();
    }
  }, [orderId, orderStatus, loadMessages]);

  useEffect(() => {
    if (orderStatus !== 'accepted') return;
    const interval = setInterval(() => loadMessages(true), 5000);
    return () => clearInterval(interval);
  }, [orderId, orderStatus, loadMessages]);

  const prevMessagesLengthRef = useRef(0);
  const initialScrollDone = useRef(false);

  useEffect(() => {
    const isNewArrived = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (!isNewArrived) return;

    // Первая загрузка — всегда скроллим вниз через requestAnimationFrame (iOS fix)
    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      isAtBottomRef.current = true;
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (container) container.scrollTop = container.scrollHeight;
      });
      return;
    }

    if (isAtBottomRef.current) {
      scrollToBottom();
    } else {
      setHasNewMessages(true);
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: 'Файл слишком большой', description: 'Максимальный размер — 20 МБ', variant: 'destructive' });
      return;
    }
    const preview = URL.createObjectURL(file);
    setPendingFile({ file, preview });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = () => {
    if (pendingFile) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !pendingFile) return;
    if (isSending) return;
    const user = getSession();
    if (!user?.id) return;

    try {
      setIsSending(true);
      const payload: Record<string, unknown> = {
        orderId,
        senderId: user.id,
        senderType: isBuyer ? 'buyer' : 'seller',
        message: newMessage.trim(),
      };

      if (pendingFile) {
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(pendingFile.file);
        });
        payload.fileData = fileData;
        payload.fileName = pendingFile.file.name;
        payload.fileType = pendingFile.file.type;
      }

      await ordersAPI.createMessage(payload as Parameters<typeof ordersAPI.createMessage>[0]);
      setNewMessage('');
      removePendingFile();
      isAtBottomRef.current = true;
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

  if (orderStatus !== 'accepted' && orderStatus !== 'completed') {
    return null;
  }

  const isCompleted = orderStatus === 'completed';

  // Для завершённых — кнопка раскрытия истории
  if (isCompleted) {
    return (
      <>
        <Separator />
        <div>
          <button
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            onClick={() => setShowHistory(!showHistory)}
          >
            <Icon name="MessageSquare" className="h-4 w-4" />
            <span>История сообщений</span>
            {messages.length > 0 && <span className="text-xs">({messages.length})</span>}
            <Icon name={showHistory ? 'ChevronUp' : 'ChevronDown'} className="h-3.5 w-3.5 ml-auto" />
          </button>

          {showHistory && (
            <div className="mt-2">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-4">
                  <Icon name="Loader2" className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length > 0 ? (
                <div className="relative">
                  <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="space-y-2 max-h-[200px] overflow-y-auto mb-2 pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {messages.map((msg) => {
                      const isMe = isBuyer ? msg.senderType === 'buyer' : msg.senderType === 'seller';
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-muted' : 'bg-primary/10 text-foreground'}`}>
                            <div className="mb-0.5">
                              {isMe ? (
                                <span className="text-[10px] opacity-60">Вы</span>
                              ) : (
                                <>
                                  <span className="text-xs font-semibold opacity-80">{msg.senderName}</span>
                                  <span className="text-[10px] opacity-50 ml-1.5">· {getSenderRole(msg.senderType)}</span>
                                </>
                              )}
                            </div>
                            <p className="whitespace-pre-line break-words">{msg.message}</p>
                            <p className="text-[10px] mt-1 text-muted-foreground">
                              {new Date(msg.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-2">Сообщений не было</p>
              )}
            </div>
          )}
        </div>
      </>
    );
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
          <div className="relative">
            <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="space-y-2 max-h-[200px] overflow-y-auto mb-3 pr-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {messages.map((msg) => {
              const isMe = isBuyer ? msg.senderType === 'buyer' : msg.senderType === 'seller';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isMe ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                    <div className="mb-0.5">
                      {isMe ? (
                        <span className="text-[10px] opacity-60">Вы</span>
                      ) : (
                        <>
                          <span className="text-xs font-semibold opacity-80">{msg.senderName}</span>
                          <span className="text-[10px] opacity-50 ml-1.5">· {getSenderRole(msg.senderType)}</span>
                        </>
                      )}
                    </div>
                    {msg.message && <p className="whitespace-pre-line break-words">{msg.message}</p>}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {msg.attachments.map((att, i) => (
                          att.type.startsWith('video/') ? (
                            <video key={i} src={att.url} controls className="max-w-full rounded max-h-40" />
                          ) : att.type.startsWith('image/') ? (
                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                              <img src={att.url} alt={att.name} className="max-w-full rounded max-h-40 cursor-pointer hover:opacity-90 transition-opacity" />
                            </a>
                          ) : (
                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs underline opacity-80">
                              <Icon name="Paperclip" size={12} />
                              {att.name}
                            </a>
                          )
                        ))}
                      </div>
                    )}
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {new Date(msg.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
            </div>
            {hasNewMessages && (
              <button
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-all animate-bounce z-10"
              >
                <Icon name="ArrowDown" size={12} />
                Новые сообщения
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground mb-3">Здесь можно уточнить детали, задать вопрос или оставить комментарий</p>
        )}

        {pendingFile && (
          <div className="mb-2 flex items-center gap-2 bg-muted rounded-lg px-2 py-1.5">
            {pendingFile.file.type.startsWith('image/') ? (
              <img src={pendingFile.preview} alt="preview" className="h-10 w-10 object-cover rounded" />
            ) : pendingFile.file.type.startsWith('video/') ? (
              <video src={pendingFile.preview} className="h-10 w-10 object-cover rounded" />
            ) : (
              <Icon name="Paperclip" className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-xs text-muted-foreground flex-1 truncate">{pendingFile.file.name}</span>
            <button onClick={removePendingFile} className="text-muted-foreground hover:text-destructive transition-colors">
              <Icon name="X" size={14} />
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
            title="Прикрепить фото/видео"
          >
            <Icon name="Paperclip" className="h-4 w-4 text-muted-foreground" />
          </button>
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
            disabled={(!newMessage.trim() && !pendingFile) || isSending}
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