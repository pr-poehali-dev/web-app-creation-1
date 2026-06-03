import { useRef, useEffect, useCallback, useState } from 'react';
import Icon from '@/components/ui/icon';
import ConfirmDialog from '@/components/ui/confirm-dialog';
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
                    {msg.attachments.map((att, i) => {
                      const urlExt = att.url?.split('?')[0].split('.').pop()?.toLowerCase() || '';
                      const nameExt = att.name?.split('.').pop()?.toLowerCase() || '';
                      const videoExts = ['mp4','mov','avi','mkv','webm','m4v','3gp'];
                      const audioExts = ['mp3','ogg','webm','m4a','wav','opus'];
                      const imageExts = ['jpg','jpeg','png','gif','webp','heic','heif'];
                      const isAudio = att.type?.startsWith('audio/') || audioExts.includes(urlExt) || audioExts.includes(nameExt);
                      const isVideo = !isAudio && (att.type?.startsWith('video/') || videoExts.includes(urlExt) || videoExts.includes(nameExt));
                      const isImage = !isAudio && !isVideo && (att.type?.startsWith('image/') || imageExts.includes(urlExt) || imageExts.includes(nameExt));
                      return isAudio ? (
                        <audio key={i} src={att.url} controls className="max-w-full h-8" style={{ minWidth: 180 }} />
                      ) : isVideo ? (
                        <video key={i} src={att.url} controls className="max-w-full rounded max-h-40" playsInline />
                      ) : isImage ? (
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
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <p className={`text-[10px] ${isMe ? (isHistory ? 'text-muted-foreground' : 'text-muted-foreground') : 'text-muted-foreground'}`}>
                      {new Date(msg.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {isMe && (
                      msg.isRead
                        ? <Icon name="CheckCheck" size={12} className="text-blue-500 shrink-0" title="Прочитано" />
                        : <Icon name="Check" size={12} className="text-muted-foreground/60 shrink-0" title="Отправлено" />
                    )}
                  </div>

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

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Удалить сообщение?"
        description="Сообщение и прикреплённый файл будут удалены безвозвратно."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        confirmClassName="bg-destructive hover:bg-destructive/90 text-white"
        onConfirm={() => { if (confirmDeleteId && onDeleteMessage) { onDeleteMessage(confirmDeleteId); setConfirmDeleteId(null); } }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}