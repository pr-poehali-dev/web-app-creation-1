import { useState, useEffect, useRef, useCallback } from 'react';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { ordersAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { type OrderMessage, playNotificationSound } from './chat-types';
import ChatMessageList from './ChatMessageList';
import ChatInputBar from './ChatInputBar';

interface OrderFeedbackChatProps {
  orderId: string;
  orderStatus: string;
  isBuyer: boolean;
  isRequest?: boolean;
  onLightboxOpen?: (url: string) => void;
}

export default function OrderFeedbackChat({ orderId, orderStatus, isBuyer, isRequest, onLightboxOpen }: OrderFeedbackChatProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const prevOrderStatus = useRef(orderStatus);
  const [showHistory, setShowHistory] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const isFirstLoad = useRef(true);
  const isAtBottomRef = useRef(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const prevMessagesLengthRef = useRef(0);
  const initialScrollDone = useRef(false);

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

  useEffect(() => {
    const isNewArrived = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (!isNewArrived) return;

    if (!initialScrollDone.current) {
      initialScrollDone.current = true;
      isAtBottomRef.current = true;
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) container.scrollTop = container.scrollHeight;
      }, 300);
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
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 30 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      e.target.value = '';
      setTimeout(() => {
        if (isVideo) {
          toast({ title: 'Файл слишком большой для отправки', description: 'Лимит видео — 30 МБ (~30 сек). Попробуй отправить частями или сократи длительность.', variant: 'destructive' });
        } else {
          toast({ title: 'Файл слишком большой для отправки', description: 'Максимальный размер фото — 20 МБ.', variant: 'destructive' });
        }
      }, 100);
      return;
    }
    const preview = URL.createObjectURL(file);
    setPendingFile({ file, preview });
    if (e.target) e.target.value = '';
  };

  const removePendingFile = () => {
    if (pendingFile) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await ordersAPI.deleteMessage(messageId);
      await loadMessages(true);
    } catch (e) {
      toast({ title: 'Не удалось удалить сообщение', variant: 'destructive' });
    }
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `voice_${Date.now()}.${ext}`, { type: mimeType });
        const preview = URL.createObjectURL(blob);
        setPendingFile({ file, preview });
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch {
      toast({ title: 'Нет доступа к микрофону', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      audioChunksRef.current = [];
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      setRecordingTime(0);
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
              <ChatMessageList
                messages={messages}
                isLoading={isLoadingMessages}
                isBuyer={isBuyer}
                isRequest={isRequest}
                hasNewMessages={false}
                isHistory
                onNewMessagesSeen={() => {}}
                onLightboxOpen={onLightboxOpen ?? (() => {})}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
                onScroll={handleMessagesScroll}
              />
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

        <ChatMessageList
          messages={messages}
          isLoading={isLoadingMessages}
          isBuyer={isBuyer}
          isRequest={isRequest}
          hasNewMessages={hasNewMessages}
          onNewMessagesSeen={() => scrollToBottom(true)}
          onLightboxOpen={onLightboxOpen ?? (() => {})}
          messagesContainerRef={messagesContainerRef}
          messagesEndRef={messagesEndRef}
          onScroll={handleMessagesScroll}
          onDeleteMessage={handleDeleteMessage}
        />

        <ChatInputBar
          newMessage={newMessage}
          isSending={isSending}
          pendingFile={pendingFile}
          isRecording={isRecording}
          recordingTime={recordingTime}
          onMessageChange={setNewMessage}
          onSend={handleSendMessage}
          onKeyDown={handleKeyDown}
          onFileSelect={handleFileSelect}
          onRemovePendingFile={removePendingFile}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onCancelRecording={cancelRecording}
        />
      </div>
    </>
  );
}