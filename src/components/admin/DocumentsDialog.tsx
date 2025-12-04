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
  passportRegistrationUrl: string | null;
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
                  <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" className="h-5 w-5 text-primary" />
                        <span className="font-medium">Скан паспорта</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(selectedVerification.passportScanUrl!, '_blank')}
                      >
                        <Icon name="Eye" className="h-4 w-4 mr-2" />
                        Просмотреть
                      </Button>
                    </div>
                  </div>
                )}

                {selectedVerification.passportRegistrationUrl && (
                  <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" className="h-5 w-5 text-primary" />
                        <span className="font-medium">Страница паспорта с регистрацией</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(selectedVerification.passportRegistrationUrl!, '_blank')}
                      >
                        <Icon name="Eye" className="h-4 w-4 mr-2" />
                        Просмотреть
                      </Button>
                    </div>
                  </div>
                )}

                {selectedVerification.utilityBillUrl && (
                  <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" className="h-5 w-5 text-primary" />
                        <span className="font-medium">Коммунальный платеж</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(selectedVerification.utilityBillUrl!, '_blank')}
                      >
                        <Icon name="Eye" className="h-4 w-4 mr-2" />
                        Просмотреть
                      </Button>
                    </div>
                  </div>
                )}

                {selectedVerification.registrationCertUrl && (
                  <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" className="h-5 w-5 text-primary" />
                        <span className="font-medium">Свидетельство о регистрации / Выписка ЕГРЮЛ</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(selectedVerification.registrationCertUrl!, '_blank')}
                      >
                        <Icon name="Eye" className="h-4 w-4 mr-2" />
                        Просмотреть
                      </Button>
                    </div>
                  </div>
                )}

                {selectedVerification.agreementFormUrl && (
                  <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="FileText" className="h-5 w-5 text-primary" />
                        <span className="font-medium">Форма согласия</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(selectedVerification.agreementFormUrl!, '_blank')}
                      >
                        <Icon name="Eye" className="h-4 w-4 mr-2" />
                        Просмотреть
                      </Button>
                    </div>
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