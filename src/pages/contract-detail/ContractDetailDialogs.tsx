import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ContractRespondDialog from '@/components/contract-detail/ContractRespondDialog';
import ContractRespondVerificationDialog from '@/components/contract-detail/ContractRespondVerificationDialog';
import ContractNegotiationModal from '@/components/contract/ContractNegotiationModal';
import { Contract } from './useContractDetail';

interface ContractDetailDialogsProps {
  contract: Contract;
  isBarter: boolean;
  respondOpen: boolean;
  onRespondOpenChange: (open: boolean) => void;
  respondPrice: string;
  onRespondPriceChange: (v: string) => void;
  respondComment: string;
  onRespondCommentChange: (v: string) => void;
  isSubmitting: boolean;
  onSubmitRespond: () => void;
  formatPrice: (p: number) => string;
  showGuestDialog: boolean;
  onGuestDialogChange: (open: boolean) => void;
  respondVerifDialog: { open: boolean; mode: 'not-verified' | 'pending' | 'barter-restricted' };
  onRespondVerifDialogChange: (open: boolean) => void;
  negotiationOpen: boolean;
  negotiationResponseId: number | null;
  onNegotiationClose: () => void;
  onStatusChange: () => void;
}

export default function ContractDetailDialogs({
  contract,
  isBarter,
  respondOpen,
  onRespondOpenChange,
  respondPrice,
  onRespondPriceChange,
  respondComment,
  onRespondCommentChange,
  isSubmitting,
  onSubmitRespond,
  formatPrice,
  showGuestDialog,
  onGuestDialogChange,
  respondVerifDialog,
  onRespondVerifDialogChange,
  negotiationOpen,
  negotiationResponseId,
  onNegotiationClose,
  onStatusChange,
}: ContractDetailDialogsProps) {
  const navigate = useNavigate();

  return (
    <>
      <ContractRespondDialog
        open={respondOpen}
        onOpenChange={onRespondOpenChange}
        isBarter={isBarter}
        respondPrice={respondPrice}
        onRespondPriceChange={onRespondPriceChange}
        respondComment={respondComment}
        onRespondCommentChange={onRespondCommentChange}
        isSubmitting={isSubmitting}
        onSubmit={onSubmitRespond}
        contractPricePerUnit={contract.pricePerUnit}
        contractQuantity={contract.quantity}
        formatPrice={formatPrice}
      />

      <Dialog open={showGuestDialog} onOpenChange={onGuestDialogChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Войдите, чтобы откликнуться</DialogTitle>
            <DialogDescription>
              Для отклика на контракт и участия в переговорах необходимо войти в аккаунт.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => navigate('/login')} className="w-full">Войти</Button>
            <Button variant="outline" onClick={() => navigate('/register')} className="w-full">Зарегистрироваться</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ContractRespondVerificationDialog
        open={respondVerifDialog.open}
        onOpenChange={onRespondVerifDialogChange}
        mode={respondVerifDialog.mode}
      />

      {negotiationOpen && negotiationResponseId && (
        <ContractNegotiationModal
          isOpen={true}
          onClose={onNegotiationClose}
          responseId={negotiationResponseId}
          contractTitle={contract.title || contract.productName || `Контракт #${contract.id}`}
          onStatusChange={onStatusChange}
        />
      )}
    </>
  );
}
