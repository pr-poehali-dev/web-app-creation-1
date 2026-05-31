import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import { buildContractHtml } from './NegotiationTypes';
import { useNegotiationData } from './useNegotiationData';
import { useNegotiationMedia } from './useNegotiationMedia';
import NegotiationHeader from './NegotiationHeader';
import NegotiationChatTab from './NegotiationChatTab';
import NegotiationContractTab from './NegotiationContractTab';
import { NegotiationFooter, ConfirmDialog, CancelDialog } from './NegotiationDialogs';
import ContractPreviewModal from './ContractPreviewModal';
import { useToast } from '@/hooks/use-toast';
import func2url from '../../../backend/func2url.json';

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

  const [activeTab, setActiveTab] = useState<'chat' | 'preview'>('chat');
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { status, messages, isLoading, scrollRef, loadStatus, loadMessages } = useNegotiationData({
    isOpen,
    responseId,
    userId,
  });

  const {
    text, setText,
    isSending,
    pendingFile,
    handleFileSelect,
    removePendingFile,
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    handleSend,
  } = useNegotiationMedia({
    userId,
    responseId,
    onMessageSent: loadMessages,
  });

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
    setPreviewHtml(buildContractHtml(status, status.contract));
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

  if (previewHtml) {
    return (
      <ContractPreviewModal html={previewHtml} onClose={() => setPreviewHtml(null)} />
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0" onPointerDownOutside={(e) => e.preventDefault()}>
          <NegotiationHeader
            contractTitle={contractTitle}
            status={status}
            isSeller={isSeller}
            isConfirmed={isConfirmed}
            isCancelled={isCancelled}
            myConfirmed={myConfirmed}
            otherConfirmed={otherConfirmed}
            otherName={otherName}
            activeTab={activeTab}
            onTabChange={(tab) => { setActiveTab(tab); if (tab === 'chat') setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 50); }}
          />

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
                <NegotiationContractTab
                  status={status}
                  userId={userId}
                  onStatusChange={() => { loadStatus(); onStatusChange?.(); }}
                />
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
