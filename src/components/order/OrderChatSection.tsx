import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { ChatMessage } from '@/types/order';
import { formatTimeWithTimezone } from '@/utils/dateUtils';
import { chatPolling } from '@/services/chatPolling';

interface OrderChatSectionProps {
  orderId: string;
  messages: ChatMessage[];
  currentUserId?: string;
  onSendMessage: (message: string) => void;
  onNewMessages?: (messages: ChatMessage[]) => void;
  isCompleted: boolean;
  usePolling?: boolean;
}

export default function OrderChatSection({
  orderId,
  messages,
  currentUserId,
  onSendMessage,
  onNewMessages,
  isCompleted,
  usePolling = true,
}: OrderChatSectionProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isPollingActive, setIsPollingActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Polling подключение для получения новых сообщений
  useEffect(() => {
    if (!usePolling || !currentUserId || isCompleted) return;

    // Получаем timestamp последнего сообщения
    const lastMessage = messages.length > 0 
      ? messages[messages.length - 1]
      : null;
    const lastTimestamp = lastMessage?.timestamp 
      ? new Date(lastMessage.timestamp).toISOString() 
      : undefined;

    const handleNewMessages = (newMessages: ChatMessage[]) => {
      console.log(`📨 Получено ${newMessages.length} новых сообщений через polling`);
      if (onNewMessages && newMessages.length > 0) {
        onNewMessages(newMessages);
      }
    };

    chatPolling.onMessage(handleNewMessages);
    chatPolling.start(orderId, lastTimestamp);
    setIsPollingActive(true);

    // Останавливаем при размонтировании
    return () => {
      chatPolling.stop();
      chatPolling.removeMessageHandler(handleNewMessages);
      setIsPollingActive(false);
    };
  }, [orderId, currentUserId, usePolling, isCompleted, onNewMessages]);

  // Прокручиваем вниз при изменении сообщений
  useEffect(() => {
    if (scrollRef.current) {
      // Используем setTimeout для гарантии что DOM обновился
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [messages.length, messages]);

  const handleSend = () => {
    if (newMessage.trim() && currentUserId) {
      // Отправляем через обычный HTTP API
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-shrink-0 flex flex-col border-t px-4 sm:px-6 py-3 bg-background">
      {usePolling && (
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPollingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-muted-foreground">
              {isPollingActive ? 'Авто-обновление активно' : 'Обычный режим'}
            </span>
          </div>
          {isPollingActive && (
            <Badge variant="secondary" className="text-xs">Polling</Badge>
          )}
        </div>
      )}
      <div className="h-40 sm:h-48 overflow-y-auto mb-3 pr-2" ref={scrollRef}>
        <div className="space-y-2">
          {messages.filter(msg => msg.message && msg.message.trim()).length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <Icon name="MessageSquare" className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Начните общение</p>
            </div>
          ) : (
            messages.filter(msg => msg.message && msg.message.trim()).map((msg, index) => {
              const isOwn = msg.senderId === currentUserId;
              // Используем комбинацию id + index для уникального key (на случай дублей)
              const uniqueKey = `${msg.id}-${index}`;
              return (
                <div
                  key={uniqueKey}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-lg px-3 py-2 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800'
                    }`}
                  >
                    <p className={`text-sm whitespace-pre-wrap break-words ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}>{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {formatTimeWithTimezone(msg.timestamp, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isCompleted ? (
        <div className="text-center py-2 text-sm text-muted-foreground">
          Чат закрыт — заказ завершён
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!newMessage.trim()} size="sm">
            <Icon name="Send" className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}