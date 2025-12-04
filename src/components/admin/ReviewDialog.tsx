import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

interface Verification {
  id: number;
  userId: number;
  verificationType: string;
  status: string;
  phone: string;
  phoneVerified: boolean;
  registrationAddress: string | null;
  actualAddress: string | null;
  passportScanUrl: string | null;
  utilityBillUrl: string | null;
  registrationCertUrl: string | null;
  agreementFormUrl: string | null;
  companyName: string | null;
  inn: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
}

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVerification: Verification | null;
  reviewAction: 'approve' | 'reject';
  rejectionReason: string;
  onRejectionReasonChange: (reason: string) => void;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function ReviewDialog({
  open,
  onOpenChange,
  selectedVerification,
  reviewAction,
  rejectionReason,
  onRejectionReasonChange,
  isSubmitting,
  onSubmit
}: ReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {reviewAction === 'approve' ? 'Одобрить заявку' : 'Отклонить заявку'}
          </DialogTitle>
          <DialogDescription>
            {selectedVerification && (
              <>
                Пользователь: {selectedVerification.userLastName} {selectedVerification.userFirstName}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {reviewAction === 'reject' && (
          <div>
            <Label htmlFor="rejectionReason">Причина отклонения *</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              placeholder="Укажите причину отклонения заявки"
              rows={4}
              required
            />
          </div>
        )}

        {reviewAction === 'approve' && (
          <Alert>
            <Icon name="Info" className="h-4 w-4" />
            <AlertDescription>
              После одобрения пользователь получит доступ к созданию запросов и предложений.
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            variant={reviewAction === 'approve' ? 'default' : 'destructive'}
          >
            {isSubmitting ? (
              <>
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                {reviewAction === 'approve' ? 'Одобрить' : 'Отклонить'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
