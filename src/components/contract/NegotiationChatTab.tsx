import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { ChatMessage, MessageAttachment, formatRecordingTime } from './NegotiationTypes';

interface NegotiationChatTabProps {
  messages: ChatMessage[];
  userId: string;
  text: string;
  onTextChange: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
  isCancelled: boolean;
  pendingFile: { file: File; preview: string } | null;
  onRemovePendingFile: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export default function NegotiationChatTab({
  messages,
  userId,
  text,
  onTextChange,
  onSend,
  isSending,
  isCancelled,
  pendingFile,
  onRemovePendingFile,
  onFileSelect,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  scrollRef,
}: NegotiationChatTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const showMicBtn = !pendingFile && !text.trim() && !isRecording;

  // Лайтбокс для полноэкранного просмотра фото
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const openLightbox = (url: string) => {
    setLightboxUrl(url);
    document.body.setAttribute('data-lightbox-open', 'true');
  };

  const closeLightbox = () => {
    setLightboxUrl(null);
    document.body.removeAttribute('data-lightbox-open');
  };

  // Определяем тип файла учитывая что iOS может не заполнять file.type
  const getFileType = (file: File): string => {
    if (file.type) return file.type;
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
      gif: 'image/gif', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
      mp4: 'video/mp4', mov: 'video/quicktime', m4v: 'video/x-m4v', webm: 'video/webm',
    };
    return map[ext] || 'application/octet-stream';
  };

  const pendingFileType = pendingFile ? getFileType(pendingFile.file) : '';

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Лайтбокс — через portal в body, вне Dialog чтобы крестик не дублировался */}
      {lightboxUrl && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={closeLightbox}
        >
          <button
            style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 1000000, background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.6)', borderRadius: 12, padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', touchAction: 'manipulation', color: '#fff', fontSize: 16, fontWeight: 600 }}
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
          >
            <Icon name="X" size={20} style={{ color: '#fff' }} />
            Закрыть
          </button>
          <img
            src={lightboxUrl}
            alt="Просмотр"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <Icon name="MessageCircle" className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm">Начните переговоры — напишите первое сообщение</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isOwn = msg.senderId === userId;
              const attachments = (msg.attachments || []) as MessageAttachment[];
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-2.5 space-y-1 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {!isOwn && <p className="text-xs font-semibold opacity-70">{msg.senderName}</p>}
                    {msg.text && <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>}
                    {attachments.map((att, i) => (
                      <div key={i} className="mt-1">
                        {att.type?.startsWith('audio/') ? (
                          <audio src={att.url} controls className="max-w-full h-8" />
                        ) : att.type?.startsWith('video/') ? (
                          <video
                            src={att.url}
                            controls
                            playsInline
                            preload="metadata"
                            className="max-w-full rounded max-h-48"
                          />
                        ) : att.type?.startsWith('image/') ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="max-w-full rounded max-h-48 object-cover cursor-pointer"
                            onClick={() => openLightbox(att.url)}
                          />
                        ) : (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1.5 text-xs underline ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}
                          >
                            <Icon name="Paperclip" size={12} />
                            {att.name}
                          </a>
                        )}
                      </div>
                    ))}
                    <p className={`text-xs ${isOwn ? 'opacity-70' : 'text-muted-foreground'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!isCancelled && (
        <>
          <Separator />
          <div className="p-3 space-y-2">
            {pendingFile && (
              <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1.5">
                {pendingFileType.startsWith('audio/') ? (
                  <>
                    <Icon name="Mic" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <audio src={pendingFile.preview} controls className="h-8 flex-1" />
                  </>
                ) : pendingFileType.startsWith('image/') ? (
                  <img src={pendingFile.preview} alt="preview" className="h-10 w-10 object-cover rounded flex-shrink-0" />
                ) : pendingFileType.startsWith('video/') ? (
                  <video src={pendingFile.preview} className="h-10 w-10 object-cover rounded flex-shrink-0" playsInline />
                ) : (
                  <Icon name="Paperclip" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-xs text-muted-foreground truncate flex-1">{pendingFile.file.name}</span>
                <button onClick={onRemovePendingFile} className="text-muted-foreground hover:text-destructive transition-colors ml-auto flex-shrink-0">
                  <Icon name="X" size={14} />
                </button>
              </div>
            )}

            {isRecording ? (
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-destructive bg-destructive/5">
                  <span className="inline-block w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  <span className="text-sm text-destructive font-medium">Запись {formatRecordingTime(recordingTime)}</span>
                </div>
                <button
                  onClick={onCancelRecording}
                  className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors"
                  title="Отменить"
                >
                  <Icon name="X" className="h-4 w-4 text-muted-foreground" />
                </button>
                <Button size="sm" onClick={onStopRecording} className="flex-shrink-0 px-3 bg-destructive hover:bg-destructive/90">
                  <Icon name="Square" className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {/* Медиа-инпут: фото + видео (все форматы включая HEIC) */}
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={onFileSelect}
                />
                {/* Документы */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={onFileSelect}
                />
                {/* Кнопка фото/видео */}
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={isSending || !!pendingFile}
                  className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
                  title="Фото или видео"
                >
                  <Icon name="Image" className="h-4 w-4 text-muted-foreground" />
                </button>
                {/* Кнопка документа */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending || !!pendingFile}
                  className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
                  title="Прикрепить документ"
                >
                  <Icon name="Paperclip" className="h-4 w-4 text-muted-foreground" />
                </button>
                {showMicBtn && (
                  <button
                    type="button"
                    onClick={onStartRecording}
                    disabled={isSending}
                    className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
                    title="Голосовое сообщение"
                  >
                    <Icon name="Mic" className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
                <Input
                  value={text}
                  onChange={(e) => onTextChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                  placeholder="Сообщение..."
                  disabled={isSending}
                  className="text-sm"
                />
                <Button onClick={onSend} disabled={isSending || (!text.trim() && !pendingFile)} size="sm" className="gap-1.5 px-3">
                  {isSending ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}