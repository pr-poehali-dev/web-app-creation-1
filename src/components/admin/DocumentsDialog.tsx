import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface DocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVerification: Verification | null;
  getVerificationTypeLabel: (type: string) => string;
}

export default function DocumentsDialog({
  open,
  onOpenChange,
  selectedVerification,
  getVerificationTypeLabel
}: DocumentsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Документы верификации</DialogTitle>
          <DialogDescription>
            {selectedVerification && (
              <>{selectedVerification.userLastName} {selectedVerification.userFirstName} • {selectedVerification.userEmail}</>
            )}
          </DialogDescription>
        </DialogHeader>

        {selectedVerification && (
          <div className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Тип:</span>
                  <span className="ml-2 font-medium">{getVerificationTypeLabel(selectedVerification.verificationType)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Телефон:</span>
                  <span className="ml-2 font-medium">{selectedVerification.phone}</span>
                  {selectedVerification.phoneVerified && (
                    <Badge variant="secondary" className="ml-2">Подтвержден</Badge>
                  )}
                </div>
              </div>

              {selectedVerification.companyName && (
                <div>
                  <span className="text-muted-foreground text-sm">Компания:</span>
                  <p className="font-medium">{selectedVerification.companyName}</p>
                </div>
              )}

              {selectedVerification.inn && (
                <div>
                  <span className="text-muted-foreground text-sm">ИНН:</span>
                  <p className="font-medium">{selectedVerification.inn}</p>
                </div>
              )}

              {selectedVerification.registrationAddress && (
                <div>
                  <span className="text-muted-foreground text-sm">Адрес регистрации:</span>
                  <p className="font-medium">{selectedVerification.registrationAddress}</p>
                </div>
              )}

              {selectedVerification.actualAddress && (
                <div>
                  <span className="text-muted-foreground text-sm">Фактический адрес:</span>
                  <p className="font-medium">{selectedVerification.actualAddress}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Загруженные документы</h4>
              <div className="grid gap-4">
                {selectedVerification.passportScanUrl && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" className="h-5 w-5 text-primary" />
                        <span className="font-medium">Скан паспорта</span>
                      </div>
                      <a 
                        href={selectedVerification.passportScanUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <Icon name="ExternalLink" className="h-4 w-4" />
                        Открыть в новом окне
                      </a>
                    </div>
                    <img 
                      src={selectedVerification.passportScanUrl} 
                      alt="Скан паспорта" 
                      className="w-full rounded border max-h-[400px] object-contain cursor-pointer"
                      onClick={() => window.open(selectedVerification.passportScanUrl!, '_blank')}
                    />
                  </div>
                )}

                {selectedVerification.utilityBillUrl && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" className="h-5 w-5 text-primary" />
                        <span className="font-medium">Коммунальный платеж</span>
                      </div>
                      <a 
                        href={selectedVerification.utilityBillUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <Icon name="ExternalLink" className="h-4 w-4" />
                        Открыть в новом окне
                      </a>
                    </div>
                    <img 
                      src={selectedVerification.utilityBillUrl} 
                      alt="Коммунальный платеж" 
                      className="w-full rounded border max-h-[400px] object-contain cursor-pointer"
                      onClick={() => window.open(selectedVerification.utilityBillUrl!, '_blank')}
                    />
                  </div>
                )}

                {selectedVerification.registrationCertUrl && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" className="h-5 w-5 text-primary" />
                        <span className="font-medium">Свидетельство о регистрации / Выписка ЕГРЮЛ</span>
                      </div>
                      <a 
                        href={selectedVerification.registrationCertUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <Icon name="ExternalLink" className="h-4 w-4" />
                        Открыть в новом окне
                      </a>
                    </div>
                    <img 
                      src={selectedVerification.registrationCertUrl} 
                      alt="Свидетельство о регистрации" 
                      className="w-full rounded border max-h-[400px] object-contain cursor-pointer"
                      onClick={() => window.open(selectedVerification.registrationCertUrl!, '_blank')}
                    />
                  </div>
                )}

                {selectedVerification.agreementFormUrl && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" className="h-5 w-5 text-primary" />
                        <span className="font-medium">Форма согласия</span>
                      </div>
                      <a 
                        href={selectedVerification.agreementFormUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        <Icon name="ExternalLink" className="h-4 w-4" />
                        Открыть в новом окне
                      </a>
                    </div>
                    <img 
                      src={selectedVerification.agreementFormUrl} 
                      alt="Форма согласия" 
                      className="w-full rounded border max-h-[400px] object-contain cursor-pointer"
                      onClick={() => window.open(selectedVerification.agreementFormUrl!, '_blank')}
                    />
                  </div>
                )}

                {!selectedVerification.passportScanUrl && 
                 !selectedVerification.utilityBillUrl && 
                 !selectedVerification.registrationCertUrl && 
                 !selectedVerification.agreementFormUrl && (
                  <Alert>
                    <Icon name="AlertCircle" className="h-4 w-4" />
                    <AlertDescription>
                      Документы не загружены
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}