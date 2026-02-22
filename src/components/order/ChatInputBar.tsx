import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { unlockAudio } from './chat-types';

interface PendingFile {
  file: File;
  preview: string;
}

interface ChatInputBarProps {
  newMessage: string;
  isSending: boolean;
  pendingFile: PendingFile | null;
  isRecording: boolean;
  recordingTime: number;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePendingFile: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

function formatRecordingTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function ChatInputBar({
  newMessage,
  isSending,
  pendingFile,
  isRecording,
  recordingTime,
  onMessageChange,
  onSend,
  onKeyDown,
  onFileSelect,
  onRemovePendingFile,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
}: ChatInputBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 bg-muted rounded-lg px-2 py-1.5">
          {pendingFile.file.type.startsWith('audio/') ? (
            <Icon name="Mic" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : pendingFile.file.type.startsWith('image/') ? (
            <img src={pendingFile.preview} alt="preview" className="h-10 w-10 object-cover rounded" />
          ) : pendingFile.file.type.startsWith('video/') ? (
            <video src={pendingFile.preview} className="h-10 w-10 object-cover rounded" />
          ) : (
            <Icon name="Paperclip" className="h-4 w-4 text-muted-foreground" />
          )}
          {pendingFile.file.type.startsWith('audio/') ? (
            <audio src={pendingFile.preview} controls className="h-8 flex-1" />
          ) : (
            <span className="text-xs text-muted-foreground flex-1 truncate">{pendingFile.file.name}</span>
          )}
          <button onClick={onRemovePendingFile} className="text-muted-foreground hover:text-destructive transition-colors">
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
            type="button"
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={onFileSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || !!pendingFile}
            className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
            title="Прикрепить фото/видео"
          >
            <Icon name="Paperclip" className="h-4 w-4 text-muted-foreground" />
          </button>
          {!pendingFile && !newMessage.trim() ? (
            <button
              type="button"
              onClick={onStartRecording}
              disabled={isSending}
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
              title="Голосовое сообщение"
            >
              <Icon name="Mic" className="h-4 w-4 text-muted-foreground" />
            </button>
          ) : null}
          <Input
            placeholder="Написать сообщение..."
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={unlockAudio}
            onTouchStart={unlockAudio}
            disabled={isSending}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={onSend}
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
      )}
    </>
  );
}
