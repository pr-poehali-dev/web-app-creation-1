import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { ChatMessage, ChatAttachment } from '@/types/chat';

interface ChatBoxProps {
  orderId: string;
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  currentUserType: 'buyer' | 'seller';
  onSendMessage: (text: string, attachments?: File[]) => void;
  isLoading?: boolean;
}

export default function ChatBox({
  orderId,
  messages,
  currentUserId,
  currentUserName,
  currentUserType,
  onSendMessage,
  isLoading = false
}: ChatBoxProps) {
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef(true);
  const prevLengthRef = useRef(0);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 60;
  };

  useEffect(() => {
    const isNewMessage = messages.length > prevLengthRef.current;
    prevLengthRef.current = messages.length;
    if (isNewMessage && isAtBottomRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim() && attachments.length === 0) return;

    onSendMessage(messageText.trim(), attachments);
    setMessageText('');
    setAttachments([]);
    isAtBottomRef.current = true;
    setTimeout(scrollToBottom, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalFiles = attachments.length + files.length;

    if (totalFiles > 5) {
      alert('Максимум 5 файлов');
      return;
    }

    const totalSize = [...attachments, ...files].reduce((sum, file) => sum + file.size, 0);
    if (totalSize > 5 * 1024 * 1024) {
      alert('Общий размер файлов не должен превышать 5 МБ');
      return;
    }

    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="flex flex-col h-[500px] sm:h-[550px] lg:h-[600px]">
      <CardHeader className="pb-2 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <Icon name="MessageSquare" className="h-4 w-4 sm:h-5 sm:w-5" />
          Чат с {currentUserType === 'buyer' ? 'продавцом' : 'покупателем'}
        </CardTitle>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef} onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-8">
              <Icon name="MessageCircle" className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Пока нет сообщений. Начните общение!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.senderId === currentUserId;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      } rounded-lg p-2.5 sm:p-3 space-y-1.5`}
                    >
                      {!isOwnMessage && (
                        <p className="text-[10px] sm:text-xs font-semibold opacity-70">
                          {message.senderName}
                        </p>
                      )}
                      
                      {message.text && (
                        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                          {message.text}
                        </p>
                      )}

                      {message.attachments && message.attachments.length > 0 && (
                        <div className="space-y-1">
                          {message.attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[10px] sm:text-xs p-1.5 sm:p-2 bg-background/10 rounded hover:bg-background/20 transition-colors"
                            >
                              <Icon name="Paperclip" className="h-3 w-3 flex-shrink-0" />
                              <span className="flex-1 truncate">{attachment.name}</span>
                              <span className="text-[10px] opacity-70 flex-shrink-0">
                                {formatFileSize(attachment.size)}
                              </span>
                            </a>
                          ))}
                        </div>
                      )}

                      <p className={`text-[10px] sm:text-xs ${isOwnMessage ? 'opacity-70' : 'text-muted-foreground'}`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />

        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {attachments.length > 0 && (
            <div className="space-y-1.5">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1.5 text-xs sm:text-sm p-1.5 sm:p-2 bg-muted rounded"
                >
                  <Icon name="File" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 truncate text-xs">{file.name}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">
                    {formatFileSize(file.size)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex-shrink-0"
                  >
                    <Icon name="X" className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-1.5 sm:gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || attachments.length >= 5}
              title="Прикрепить файл"
              className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            >
              <Icon name="Paperclip" className="h-4 w-4" />
            </Button>

            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Сообщение..."
              disabled={isLoading}
              className="flex-1 text-sm h-9 sm:h-10"
            />

            <Button
              onClick={handleSend}
              disabled={isLoading || (!messageText.trim() && attachments.length === 0)}
              className="gap-1.5 h-9 sm:h-10 px-3 sm:px-4 flex-shrink-0"
              size="sm"
            >
              <Icon name="Send" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Отправить</span>
            </Button>
          </div>

          <p className="text-[10px] sm:text-xs text-muted-foreground">
            До 5 файлов, макс. 5 МБ
          </p>
        </div>
      </CardContent>
    </Card>
  );
}