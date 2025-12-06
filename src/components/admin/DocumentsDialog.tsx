import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentUrl: string;
  documentTitle: string;
}

function DocumentViewerDialog({ open, onOpenChange, documentUrl, documentTitle }: DocumentViewerDialogProps) {
  const isPdf = documentUrl.includes('.pdf') || documentUrl.includes('application/pdf');
  const isDataUrl = documentUrl.startsWith('data:');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{documentTitle}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-gray-100 rounded-lg">
          {isPdf ? (
            <iframe
              src={documentUrl}
              className="w-full h-[80vh]"
              title={documentTitle}
            />
          ) : (
            <img
              src={documentUrl}
              alt={documentTitle}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function DocumentsDialog({
  open,
  onOpenChange,
  selectedVerification,
  getVerificationTypeLabel
}: DocumentsDialogProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{ url: string; title: string } | null>(null);

  const handleViewDocument = (url: string, title: string) => {
    setCurrentDocument({ url, title });
    setViewerOpen(true);
  };

  return (
    <>
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
                          onClick={() => handleViewDocument(selectedVerification.passportScanUrl!, 'Скан паспорта')}
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
                          onClick={() => handleViewDocument(selectedVerification.passportRegistrationUrl!, 'Страница паспорта с регистрацией')}
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
                          onClick={() => handleViewDocument(selectedVerification.utilityBillUrl!, 'Коммунальный платеж')}
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
                          onClick={() => handleViewDocument(selectedVerification.registrationCertUrl!, 'Свидетельство о регистрации / Выписка ЕГРЮЛ')}
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
                          onClick={() => handleViewDocument(selectedVerification.agreementFormUrl!, 'Форма согласия')}
                        >
                          <Icon name="Eye" className="h-4 w-4 mr-2" />
                          Просмотреть
                        </Button>
                      </div>
                    </div>
                  )}

                  {!selectedVerification.passportScanUrl && 
                   !selectedVerification.passportRegistrationUrl && 
                   !selectedVerification.utilityBillUrl && 
                   !selectedVerification.registrationCertUrl && 
                   !selectedVerification.agreementFormUrl && (
                    <p className="text-muted-foreground text-center py-8">
                      Документы не загружены
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {currentDocument && (
        <DocumentViewerDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          documentUrl={currentDocument.url}
          documentTitle={currentDocument.title}
        />
      )}
    </>
  );
}
