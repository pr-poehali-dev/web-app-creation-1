import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../../backend/func2url.json';
import {
  ResponseStatus,
  ChatMessage,
  buildContractHtml,
} from './NegotiationTypes';
import NegotiationChatTab from './NegotiationChatTab';
import NegotiationContractTab from './NegotiationContractTab';
import { NegotiationFooter, ConfirmDialog, CancelDialog } from './NegotiationDialogs';

const CHAT_API = (func2url as Record<string, string>)['contract-chat'];

interface ContractNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseId: number;
  contractTitle?: string;
  onStatusChange?: () => void;
}

export default function ContractNegotiationModal({
  isOpen,
  onClose,
  responseId,
  contractTitle,
  onStatusChange,
}: ContractNegotiationModalProps) {
  const { toast } = useToast();
  const userId = (() => {
    const s = getSession() as { id?: number; userId?: number } | null;
    const raw = s?.id ?? s?.userId ?? (Number(localStorage.getItem('userId') || '0') || undefined);
    return raw ? String(raw) : '';
  })();

  const [status, setStatus] = useState<ResponseStatus | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat');

  // Медиа
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelRecordingRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const loadStatus = useCallback(async () => {
    if (!responseId) return;
    try {
      const res = await fetch(`${CHAT_API}?action=status&responseId=${responseId}`, {
        headers: { 'X-User-Id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) { console.error(e); }
  }, [responseId, userId]);

  const loadMessages = useCallback(async () => {
    if (!responseId) return;
    try {
      const res = await fetch(`${CHAT_API}?action=messages&responseId=${responseId}`, {
        headers: { 'X-User-Id': userId },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) { console.error(e); }
  }, [responseId, userId]);

  useEffect(() => {
    if (!isOpen || !responseId) return;
    setIsLoading(true);
    setActiveTab('chat');
    Promise.all([loadStatus(), loadMessages()]).finally(() => setIsLoading(false));
    pollRef.current = setInterval(loadMessages, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOpen, responseId, loadStatus, loadMessages]);

  // Запись голоса
  const sendVoiceBlob = async (blob: Blob, mimeType: string) => {
    if (!userId) return;
    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
    setIsSending(true);
    try {
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({
          responseId,
          text: '',
          fileData,
          fileName: `voice_${Date.now()}.${ext}`,
          fileType: mimeType,
        }),
      });
      if (res.ok) {
        await loadMessages();
      } else {
        toast({ title: 'Ошибка отправки голосового', variant: 'destructive' });
      }
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find(t => MediaRecorder.isTypeSupported(t)) || '';
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const usedMime = mr.mimeType || mimeType || 'audio/webm';
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (audioChunksRef.current.length === 0) return;
        const blob = new Blob(audioChunksRef.current, { type: usedMime });
        if (isCancelRecordingRef.current) {
          isCancelRecordingRef.current = false;
          return;
        }
        sendVoiceBlob(blob, usedMime);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      isCancelRecordingRef.current = false;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast({ title: 'Нет доступа к микрофону', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const cancelRecording = () => {
    isCancelRecordingRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const removePendingFile = () => {
    if (pendingFile) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const isPdf = file.type === 'application/pdf';
    const maxSize = isVideo ? 30 * 1024 * 1024 : 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'Файл слишком большой',
        description: isVideo ? 'Лимит видео — 30 МБ' : 'Лимит файла — 20 МБ',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }
    const preview = isPdf ? '' : URL.createObjectURL(file);
    setPendingFile({ file, preview });
    e.target.value = '';
  };

  const handleSend = async () => {
    if ((!text.trim() && !pendingFile) || isSending) return;
    if (!userId) {
      toast({ title: 'Ошибка', description: 'Не удалось определить пользователя. Обновите страницу и войдите снова.', variant: 'destructive' });
      return;
    }
    setIsSending(true);
    try {
      const payload: Record<string, unknown> = { responseId, text: text.trim() };

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

      const res = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setText('');
        removePendingFile();
        await loadMessages();
      } else {
        toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmChecked) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`${CHAT_API}?action=confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ responseId }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowConfirmDialog(false);
        setConfirmChecked(false);
        await loadStatus();
        if (data.bothConfirmed) {
          toast({ title: 'Контракт заключён', description: 'Обе стороны подтвердили. Договор можно скачать.' });
          onStatusChange?.();
        } else {
          toast({ title: 'Подтверждение принято', description: 'Ожидаем подтверждения второй стороны.' });
        }
      } else {
        const err = await res.json();
        toast({ title: 'Ошибка', description: err.error || 'Не удалось подтвердить', variant: 'destructive' });
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`${CHAT_API}?action=cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
        body: JSON.stringify({ responseId }),
      });
      if (res.ok) {
        setShowCancelDialog(false);
        toast({ title: 'Отклик отменён' });
        onStatusChange?.();
        onClose();
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadContract = () => {
    if (!status) return;
    const c = status.contract;
    const html = buildContractHtml(status, c);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) {
      w.onload = () => { w.print(); };
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  const isSeller = status?.sellerId === Number(userId);
  const myConfirmed = isSeller ? status?.sellerConfirmed : status?.buyerConfirmed;
  const otherConfirmed = isSeller ? status?.buyerConfirmed : status?.sellerConfirmed;
  const isConfirmed = status?.status === 'confirmed';
  const isCancelled = status?.status === 'cancelled';
  const canConfirm = !myConfirmed && !isConfirmed && !isCancelled;

  const otherName = isSeller
    ? `${status?.respondentFirstName || ''} ${status?.respondentLastName || ''}`.trim() || 'Контрагент'
    : `${status?.sellerFirstName || ''} ${status?.sellerLastName || ''}`.trim() || 'Продавец';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Icon name="FileSignature" className="h-4 w-4 text-primary" />
              <span className="truncate">{contractTitle || status?.contract?.title || 'Переговоры по контракту'}</span>
            </DialogTitle>
            {status && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isConfirmed && (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <Icon name="CheckCircle" size={12} className="mr-1" />
                    Контракт заключён
                  </Badge>
                )}
                {isCancelled && <Badge variant="destructive">Отменён</Badge>}
                {!isConfirmed && !isCancelled && (
                  <Badge variant="outline">На переговорах</Badge>
                )}
                {!isConfirmed && !isCancelled && (
                  <span className="text-xs text-muted-foreground">
                    {myConfirmed ? '✓ Вы подтвердили' : '○ Вы не подтвердили'}
                    {' · '}
                    {otherConfirmed ? `✓ ${otherName} подтвердил(а)` : `○ ${otherName} не подтвердил(а)`}
                  </span>
                )}
              </div>
            )}
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b flex-shrink-0">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'chat' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon name="MessageSquare" size={14} />
              Чат
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${activeTab === 'preview' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon name="FileText" size={14} />
              Договор
            </button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Icon name="Loader2" className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {activeTab === 'chat' && (
                <NegotiationChatTab
                  messages={messages}
                  userId={userId}
                  text={text}
                  onTextChange={setText}
                  onSend={handleSend}
                  isSending={isSending}
                  isCancelled={isCancelled}
                  pendingFile={pendingFile}
                  onRemovePendingFile={removePendingFile}
                  onFileSelect={handleFileSelect}
                  isRecording={isRecording}
                  recordingTime={recordingTime}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  onCancelRecording={cancelRecording}
                  scrollRef={scrollRef}
                />
              )}
              {activeTab === 'preview' && (
                <NegotiationContractTab status={status} />
              )}
            </>
          )}

          <NegotiationFooter
            isConfirmed={isConfirmed}
            isCancelled={isCancelled}
            canConfirm={canConfirm}
            myConfirmed={myConfirmed}
            onDownload={handleDownloadContract}
            onOpenConfirmDialog={() => setShowConfirmDialog(true)}
            onOpenCancelDialog={() => setShowCancelDialog(true)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        confirmChecked={confirmChecked}
        onCheckedChange={setConfirmChecked}
        isConfirming={isConfirming}
        onConfirm={handleConfirm}
      />

      <CancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        isCancelling={isCancelling}
        onCancel={handleCancel}
      />
    </>
  );
}