import { useRef, useEffect, useCallback, useState } from 'react';
import Icon from '@/components/ui/icon';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { OrderMessage } from './chat-types';

interface ChatMessageListProps {
  messages: OrderMessage[];
  isLoading: boolean;
  isBuyer: boolean;
  isRequest?: boolean;
  hasNewMessages: boolean;
  isHistory?: boolean;
  onNewMessagesSeen: () => void;
  onLightboxOpen: (url: string) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
  onDeleteMessage?: (messageId: string) => void;
}

export default function ChatMessageList({
  messages,
  isLoading,
  isBuyer,
  isRequest,
  hasNewMessages,
  isHistory,
  onNewMessagesSeen,
  onLightboxOpen,
  messagesContainerRef,
  messagesEndRef,
  onScroll,
  onDeleteMessage,
}: ChatMessageListProps) {
  const isAtBottomRef = useRef(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.focus({ preventScroll: true });
    }
  }, [messages.length, messagesContainerRef]);

  const getSenderRole = useCallback((senderType: 'buyer' | 'seller') => {
    if (isRequest) {
      return senderType === 'buyer' ? 'Исполнитель' : 'Заказчик';
    }
    return senderType === 'buyer' ? 'Покупатель' : 'Продавец';
  }, [isRequest]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Icon name="Loader2" className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    if (isHistory) {
      return <p className="text-xs text-muted-foreground py-2">Сообщений не было</p>;
    }
    return <p className="text-xs text-muted-foreground mb-3">Здесь можно уточнить детали, задать вопрос или оставить комментарий</p>;
  }

  return (
    <div className="relative">
      <div
        ref={messagesContainerRef}
        onScroll={onScroll}
        tabIndex={0}
        onTouchStart={() => messagesContainerRef.current?.focus({ preventScroll: true })}
        className={`space-y-2 overflow-y-auto pr-1 outline-none ${isHistory ? 'max-h-[200px] mb-2' : 'max-h-[200px] mb-3'}`}
        style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}
      >
        {messages.map((msg) => {
          const isMe = isBuyer ? msg.senderType === 'buyer' : msg.senderType === 'seller';
          const hasAttachment = msg.attachments && msg.attachments.length > 0;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm relative ${isMe ? 'bg-muted' : isHistory ? 'bg-primary/10 text-foreground' : 'bg-primary text-primary-foreground'}`}>
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
                      att.type.startsWith('audio/') ? (
                        <audio key={i} src={att.url} controls className="max-w-full h-8" style={{ minWidth: 180 }} />
                      ) : att.type.startsWith('video/') ? (
                        <video key={i} src={att.url} controls className="max-w-full rounded max-h-40" />
                      ) : att.type.startsWith('image/') ? (
                        <img
                          key={i}
                          src={att.url}
                          alt={att.name}
                          onClick={() => onLightboxOpen(att.url)}
                          className="max-w-full rounded max-h-40 cursor-zoom-in hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs underline opacity-80">
                          <Icon name="Paperclip" size={12} />
                          {att.name}
                        </a>
                      )
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className={`text-[10px] ${isMe ? (isHistory ? 'text-muted-foreground' : 'text-primary-foreground/60') : 'text-muted-foreground'}`}>
                    {new Date(msg.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {isMe && hasAttachment && !isHistory && onDeleteMessage && (
                    <button
                      onClick={() => setConfirmDeleteId(msg.id)}
                      className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 flex-shrink-0"
                      title="Удалить сообщение"
                    >
                      <Icon name="Trash2" size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      {hasNewMessages && (
        <button
          onClick={onNewMessagesSeen}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-all animate-bounce z-10"
        >
          <Icon name="ArrowDown" size={12} />
          Новые сообщения
        </button>
      )}

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить сообщение?</AlertDialogTitle>
            <AlertDialogDescription>
              Сообщение и прикреплённый файл будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => { if (confirmDeleteId && onDeleteMessage) { onDeleteMessage(confirmDeleteId); setConfirmDeleteId(null); } }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}