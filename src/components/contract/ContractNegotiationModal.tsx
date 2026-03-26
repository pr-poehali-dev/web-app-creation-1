import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../../backend/func2url.json';

const CHAT_API = (func2url as Record<string, string>)['contracts-list'];

interface ContractInfo {
  title: string;
  productName: string;
  totalAmount: number;
  currency: string;
  contractType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  deliveryDate: string;
  contractStartDate: string;
  contractEndDate: string;
  deliveryAddress: string;
  termsConditions: string;
}

interface ResponseStatus {
  id: number;
  contractId: number;
  status: string;
  sellerConfirmed: boolean;
  buyerConfirmed: boolean;
  confirmedAt: string | null;
  pricePerUnit: number;
  totalAmount: number;
  comment: string;
  respondentFirstName: string;
  respondentLastName: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerId: number;
  respondentId: number;
  contract: ContractInfo;
}

interface MessageAttachment {
  url: string;
  name: string;
  type: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  attachments: MessageAttachment[];
  timestamp: string;
}

interface ContractNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
  responseId: number;
  contractTitle?: string;
  onStatusChange?: () => void;
}

function formatDate(d: string) {
  if (!d || d === 'None' || d === 'null') return '—';
  try { return new Date(d).toLocaleDateString('ru-RU'); } catch { return '—'; }
}

function formatAmount(n: number, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function formatRecordingTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function ContractNegotiationModal({
  isOpen,
  onClose,
  responseId,
  contractTitle,
  onStatusChange,
}: ContractNegotiationModalProps) {
  const { toast } = useToast();
  const currentUser = getSession();
  const userId = String(currentUser?.userId ?? '');

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch(`${CHAT_API}?action=chatStatus&responseId=${responseId}`, {
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
      const res = await fetch(`${CHAT_API}?action=chatMessages&responseId=${responseId}`, {
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
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
        const preview = URL.createObjectURL(blob);
        setPendingFile({ file, preview });
      };
      mr.start();
      mediaRecorderRef.current = mr;
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

  // Показываем кнопку голоса только если нет текста и нет файла
  const showMicBtn = !pendingFile && !text.trim() && !isRecording;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0" onPointerDownOutside={(e) => e.preventDefault()}>
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
              {/* Chat tab */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                                      <video src={att.url} controls className="max-w-full rounded max-h-48" />
                                    ) : att.type?.startsWith('image/') ? (
                                      <img src={att.url} alt={att.name} className="max-w-full rounded max-h-48 object-cover" />
                                    ) : (
                                      <a
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center gap-1.5 text-xs underline ${isOwn ? 'text-primary-foreground' : 'text-foreground'}`}
                                      >
                                        <Icon name="Paperclip" size={12} />
                                        {att.name || 'Файл'}
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
                  </ScrollArea>

                  {!isCancelled && (
                    <>
                      <Separator />
                      <div className="p-3 space-y-2">
                        {/* Предпросмотр файла */}
                        {pendingFile && (
                          <div className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1.5">
                            {pendingFile.file.type.startsWith('audio/') ? (
                              <>
                                <Icon name="Mic" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <audio src={pendingFile.preview} controls className="h-8 flex-1" />
                              </>
                            ) : pendingFile.file.type.startsWith('image/') ? (
                              <img src={pendingFile.preview} alt="preview" className="h-10 w-10 object-cover rounded" />
                            ) : pendingFile.file.type.startsWith('video/') ? (
                              <video src={pendingFile.preview} className="h-10 w-10 object-cover rounded" />
                            ) : (
                              <>
                                <Icon name="Paperclip" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="text-xs text-muted-foreground flex-1 truncate">{pendingFile.file.name}</span>
                              </>
                            )}
                            {!pendingFile.file.type.startsWith('audio/') && (
                              <span className="text-xs text-muted-foreground truncate flex-1">{pendingFile.file.name}</span>
                            )}
                            <button onClick={removePendingFile} className="text-muted-foreground hover:text-destructive transition-colors ml-auto">
                              <Icon name="X" size={14} />
                            </button>
                          </div>
                        )}

                        {/* Строка ввода */}
                        {isRecording ? (
                          <div className="flex gap-2 items-center">
                            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-md border border-destructive bg-destructive/5">
                              <span className="inline-block w-2 h-2 rounded-full bg-destructive animate-pulse" />
                              <span className="text-sm text-destructive font-medium">Запись {formatRecordingTime(recordingTime)}</span>
                            </div>
                            <button
                              onClick={cancelRecording}
                              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors"
                              title="Отменить"
                            >
                              <Icon name="X" className="h-4 w-4 text-muted-foreground" />
                            </button>
                            <Button size="sm" onClick={stopRecording} className="flex-shrink-0 px-3 bg-destructive hover:bg-destructive/90">
                              <Icon name="Square" className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,video/*,.pdf,.doc,.docx"
                              className="hidden"
                              onChange={handleFileSelect}
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isSending || !!pendingFile}
                              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
                              title="Прикрепить файл"
                            >
                              <Icon name="Paperclip" className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {showMicBtn && (
                              <button
                                type="button"
                                onClick={startRecording}
                                disabled={isSending}
                                className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-input bg-background hover:bg-muted transition-colors disabled:opacity-50"
                                title="Голосовое сообщение"
                              >
                                <Icon name="Mic" className="h-4 w-4 text-muted-foreground" />
                              </button>
                            )}
                            <Input
                              value={text}
                              onChange={(e) => setText(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                              placeholder="Сообщение..."
                              disabled={isSending}
                              className="text-sm"
                            />
                            <Button onClick={handleSend} disabled={isSending || (!text.trim() && !pendingFile)} size="sm" className="gap-1.5 px-3">
                              {isSending ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Send" size={14} />}
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Preview tab */}
              {activeTab === 'preview' && (
                <div className="flex-1 overflow-y-auto p-4">
                  {status ? (
                    <ContractPreviewContent status={status} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                      <Icon name="FileText" className="h-10 w-10 mb-2 opacity-30" />
                      <p className="text-sm">Загрузка данных договора...</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Footer actions */}
          {!isLoading && !isCancelled && (
            <div className="flex-shrink-0 border-t px-4 py-3 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                {!isCancelled && !isConfirmed && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1.5"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    <Icon name="X" size={14} />
                    Отменить
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {isConfirmed && (
                  <Button size="sm" onClick={handleDownloadContract} className="gap-1.5">
                    <Icon name="Download" size={14} />
                    Скачать договор
                  </Button>
                )}
                {canConfirm && (
                  <Button size="sm" onClick={() => setShowConfirmDialog(true)} className="gap-1.5 bg-green-600 hover:bg-green-700">
                    <Icon name="CheckCircle" size={14} />
                    {myConfirmed ? 'Подтверждено' : 'Принять контракт'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Подтверждение контракта</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Вы подтверждаете заключение контракта на условиях, обсуждённых в переговорах. После подтверждения обеими сторонами договор будет считаться согласованным и не подлежащим изменению без взаимного согласия.
            </p>
            <div className="flex items-start gap-2">
              <Checkbox
                id="confirm-check"
                checked={confirmChecked}
                onCheckedChange={(v) => setConfirmChecked(Boolean(v))}
              />
              <Label htmlFor="confirm-check" className="text-sm leading-snug cursor-pointer">
                Я согласен(а) с условиями контракта и подтверждаю его заключение
              </Label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setShowConfirmDialog(false); setConfirmChecked(false); }}>
              Отмена
            </Button>
            <Button
              size="sm"
              disabled={!confirmChecked || isConfirming}
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700 gap-1.5"
            >
              {isConfirming && <Icon name="Loader2" size={14} className="animate-spin" />}
              Подтвердить
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Отменить отклик?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Отклик будет отменён. Переговоры завершатся, и вернуть статус будет невозможно.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(false)}>
              Назад
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isCancelling}
              onClick={handleCancel}
              className="gap-1.5"
            >
              {isCancelling && <Icon name="Loader2" size={14} className="animate-spin" />}
              Отменить отклик
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ContractPreviewContent({ status }: { status: ResponseStatus }) {
  const c = status.contract;
  if (!c) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Icon name="FileText" className="h-10 w-10 mb-2 opacity-30" />
        <p className="text-sm">Данные договора недоступны</p>
      </div>
    );
  }
  const formatMoney = (n: number) => formatAmount(n, c.currency || 'RUB');

  return (
    <div className="space-y-4 text-sm">
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-base">{c.title || c.productName || 'Договор'}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <div>
            <span className="text-muted-foreground">Товар: </span>
            <span>{c.productName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Кол-во: </span>
            <span>{c.quantity} {c.unit}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Цена за ед.: </span>
            <span>{formatMoney(c.pricePerUnit)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Сумма: </span>
            <span className="font-medium">{formatMoney(c.totalAmount)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Поставка: </span>
            <span>{formatDate(c.deliveryDate)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Срок: </span>
            <span>{formatDate(c.contractStartDate)} — {formatDate(c.contractEndDate)}</span>
          </div>
          {c.deliveryAddress && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Адрес: </span>
              <span>{c.deliveryAddress}</span>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded-lg p-3 space-y-2">
        <h4 className="font-medium flex items-center gap-2">
          <Icon name="Users" size={14} />
          Стороны
        </h4>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-0.5">
            <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Продавец</p>
            <p>{status.sellerFirstName} {status.sellerLastName}</p>
          </div>
          <div className="space-y-0.5">
            <p className="font-medium text-muted-foreground uppercase tracking-wide text-[10px]">Покупатель</p>
            <p>{status.respondentFirstName} {status.respondentLastName}</p>
          </div>
        </div>
      </div>

      {status.status === 'confirmed' && (
        <div className="border-2 border-green-500 rounded-lg p-3 bg-green-50 text-green-800 flex items-start gap-2">
          <Icon name="ShieldCheck" size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Контракт согласован обеими сторонами</p>
            {status.confirmedAt && (
              <p className="text-xs mt-0.5">Дата согласования: {new Date(status.confirmedAt).toLocaleDateString('ru-RU')}</p>
            )}
            <p className="text-xs mt-1 opacity-80">Договор не подлежит изменению без взаимного согласия сторон</p>
          </div>
        </div>
      )}

      {c.termsConditions && (
        <div className="space-y-1.5">
          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Условия</p>
          <p className="text-sm whitespace-pre-wrap">{c.termsConditions}</p>
        </div>
      )}
    </div>
  );
}

function buildContractHtml(status: ResponseStatus, c: ContractInfo): string {
  const confirmed = status.status === 'confirmed';
  const stamp = confirmed
    ? `<div style="border:3px solid #16a34a;border-radius:8px;padding:12px 16px;color:#15803d;margin:24px 0;display:flex;align-items:flex-start;gap:10px;">
        <div style="font-size:28px;line-height:1;">✅</div>
        <div>
          <div style="font-weight:700;font-size:14px;">КОНТРАКТ СОГЛАСОВАН ОБЕИМИ СТОРОНАМИ</div>
          ${status.confirmedAt ? `<div style="font-size:12px;margin-top:4px;">Дата согласования: ${new Date(status.confirmedAt).toLocaleDateString('ru-RU')}</div>` : ''}
          <div style="font-size:11px;margin-top:4px;opacity:0.8;">Не подлежит изменению без взаимного согласия сторон</div>
        </div>
      </div>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Договор</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111;font-size:13px;line-height:1.6}
h1{text-align:center;font-size:18px}h2{font-size:14px;margin-top:20px}
table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #ccc;padding:6px 10px}th{background:#f5f5f5}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}
.party{border:1px solid #e5e7eb;border-radius:6px;padding:12px}.party-label{font-size:11px;text-transform:uppercase;color:#666;letter-spacing:.05em}
@media print{body{margin:0 20px}}</style></head><body>
${stamp}
<h1>ДОГОВОР КУПЛИ-ПРОДАЖИ (ФОРВАРДНЫЙ)</h1>
<p style="text-align:center;color:#555">${c.title}</p>
<div class="parties">
  <div class="party"><div class="party-label">Продавец</div><strong>${status.sellerFirstName} ${status.sellerLastName}</strong></div>
  <div class="party"><div class="party-label">Покупатель</div><strong>${status.respondentFirstName} ${status.respondentLastName}</strong></div>
</div>
<h2>1. Предмет договора</h2>
<table><tr><th>Товар</th><td>${c.productName}</td></tr>
<tr><th>Количество</th><td>${c.quantity} ${c.unit}</td></tr>
<tr><th>Цена за ед.</th><td>${formatAmount(c.pricePerUnit, c.currency)}</td></tr>
<tr><th>Общая сумма</th><td><strong>${formatAmount(c.totalAmount, c.currency)}</strong></td></tr>
<tr><th>Дата поставки</th><td>${formatDate(c.deliveryDate)}</td></tr>
<tr><th>Начало контракта</th><td>${formatDate(c.contractStartDate)}</td></tr>
<tr><th>Окончание контракта</th><td>${formatDate(c.contractEndDate)}</td></tr>
${c.deliveryAddress ? `<tr><th>Адрес поставки</th><td>${c.deliveryAddress}</td></tr>` : ''}
</table>
${c.termsConditions ? `<h2>2. Условия</h2><p>${c.termsConditions}</p>` : ''}
<h2>Подписи сторон</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:16px">
<div><p><strong>Продавец:</strong></p><p style="border-top:1px solid #000;padding-top:4px;margin-top:32px">${status.sellerFirstName} ${status.sellerLastName}</p></div>
<div><p><strong>Покупатель:</strong></p><p style="border-top:1px solid #000;padding-top:4px;margin-top:32px">${status.respondentFirstName} ${status.respondentLastName}</p></div>
</div>
</body></html>`;
}