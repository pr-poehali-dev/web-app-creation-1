import { useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Message, OrderDetail, formatDate, isImage, isVideo } from './types';

interface ArbitrageChatPanelProps {
  order: OrderDetail;
  messages: Message[];
  isLoadingMessages: boolean;
  onOpenDecisionDialog: () => void;
  onOpenStatusDialog: () => void;
  onRefresh: () => void;
  onMediaOpen: (url: string) => void;
}

export default function ArbitrageChatPanel({
  order,
  messages,
  isLoadingMessages,
  onOpenDecisionDialog,
  onOpenStatusDialog,
  onRefresh,
  onMediaOpen,
}: ArbitrageChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const allAttachments: { url: string; name?: string; source: string }[] = [];
  if (order.attachments) {
    order.attachments.forEach(a => allAttachments.push({ ...a, source: 'Заказ' }));
  }
  messages.forEach(m => {
    if (m.attachments) {
      m.attachments.forEach(a => allAttachments.push({ url: a.url, name: a.name, source: m.sender_name || m.senderName || '—' }));
    }
  });

  return (
    <>
      {/* Чат */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="MessageSquare" className="w-5 h-5" />
            Переписка ({messages.length} сообщений)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingMessages ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader2" className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Сообщений нет</p>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {messages.map((msg, idx) => {
                const senderName = msg.sender_name || msg.senderName || 'Неизвестно';
                const time = formatDate(msg.created_at || msg.createdAt || msg.timestamp);
                const isArbitrage = msg.message?.startsWith('⚖️');
                return (
                  <div
                    key={msg.id || idx}
                    className={`rounded-lg p-3 text-sm ${
                      isArbitrage
                        ? 'bg-purple-50 border border-purple-300'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-semibold ${isArbitrage ? 'text-purple-700' : 'text-foreground'}`}>
                        {isArbitrage ? '⚖️ Арбитр' : senderName}
                      </span>
                      <span className="text-xs text-muted-foreground">{time}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.attachments.map((att, ai) => (
                          <button
                            key={ai}
                            onClick={() => onMediaOpen(att.url)}
                            className="relative overflow-hidden rounded border bg-background hover:opacity-80 transition"
                          >
                            {isImage(att.url) ? (
                              <img src={att.url} alt={att.name || 'фото'} className="h-20 w-20 object-cover" />
                            ) : isVideo(att.url) ? (
                              <div className="h-20 w-20 flex items-center justify-center bg-black/10">
                                <Icon name="Play" className="w-6 h-6 text-primary" />
                              </div>
                            ) : (
                              <div className="h-20 w-20 flex flex-col items-center justify-center gap-1 p-2">
                                <Icon name="FileText" className="w-6 h-6 text-muted-foreground" />
                                <span className="text-xs text-center truncate w-full">{att.name || 'файл'}</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Все файлы */}
      {allAttachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Paperclip" className="w-5 h-5" />
              Все фото и файлы ({allAttachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {allAttachments.map((att, idx) => (
                <div key={idx} className="space-y-1">
                  <button
                    onClick={() => onMediaOpen(att.url)}
                    className="w-full aspect-square rounded-lg border overflow-hidden hover:opacity-80 transition bg-muted"
                  >
                    {isImage(att.url) ? (
                      <img src={att.url} alt={att.name || 'фото'} className="w-full h-full object-cover" />
                    ) : isVideo(att.url) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-black/5">
                        <Icon name="PlayCircle" className="w-8 h-8 text-primary" />
                        <span className="text-xs text-muted-foreground">видео</span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                        <Icon name="FileText" className="w-8 h-8 text-muted-foreground" />
                        <span className="text-xs text-center truncate w-full">{att.name || 'файл'}</span>
                      </div>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground text-center truncate">{att.source}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Кнопки арбитра */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onOpenDecisionDialog}
          className="bg-purple-600 hover:bg-purple-700 text-white"
          size="lg"
        >
          <Icon name="Scale" className="w-5 h-5 mr-2" />
          Вынести решение арбитра
        </Button>
        <Button
          onClick={onOpenStatusDialog}
          variant="outline"
          size="lg"
          className="border-blue-400 text-blue-700 hover:bg-blue-50"
        >
          <Icon name="RefreshCcw" className="w-4 h-4 mr-2" />
          Изменить статус
        </Button>
        <Button variant="outline" size="lg" onClick={onRefresh}>
          <Icon name="RefreshCw" className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>
    </>
  );
}
