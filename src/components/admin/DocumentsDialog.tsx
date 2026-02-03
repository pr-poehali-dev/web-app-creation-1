import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import JSZip from 'jszip';
import funcUrl from '../../../backend/func2url.json';

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
  const isDataUrl = documentUrl.startsWith('data:');
  const isPdf = documentUrl.includes('.pdf') || documentUrl.includes('application/pdf') || (isDataUrl && documentUrl.includes('application/pdf'));
  const isImage = !isPdf && (documentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) || (isDataUrl && documentUrl.startsWith('data:image/')));
  
  const handleDownload = () => {
    if (isDataUrl) {
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = documentTitle.replace(/\s+/g, '_') + (isImage ? '.png' : '.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(documentUrl, '_blank');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{documentTitle}</DialogTitle>
          <div className="flex gap-2 mt-2">
            {isDataUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Icon name="Download" className="h-4 w-4 mr-2" />
                Скачать файл
              </Button>
            )}
            {!isDataUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(documentUrl, '_blank')}
              >
                <Icon name="ExternalLink" className="h-4 w-4 mr-2" />
                Открыть в новой вкладке
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-gray-100 rounded-lg p-4">
          {isPdf ? (
            isDataUrl ? (
              <div className="flex flex-col items-center justify-center h-[75vh] gap-4">
                <Icon name="FileText" className="h-16 w-16 text-muted-foreground" />
                <p className="text-muted-foreground">PDF документ готов к скачиванию</p>
                <p className="text-sm text-muted-foreground">Браузер не может отобразить встроенный PDF. Скачайте файл для просмотра.</p>
                <Button onClick={handleDownload} variant="default" size="lg">
                  <Icon name="Download" className="h-4 w-4 mr-2" />
                  Скачать PDF
                </Button>
              </div>
            ) : (
              <iframe
                src={documentUrl}
                className="w-full h-[75vh] border-0"
                title={documentTitle}
              />
            )
          ) : isImage ? (
            <div className="flex items-center justify-center min-h-[75vh]">
              <img
                src={documentUrl}
                alt={documentTitle}
                className="max-w-full max-h-[75vh] object-contain bg-white rounded shadow-lg"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[75vh] gap-4">
              <Icon name="FileText" className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">Предварительный просмотр недоступен для этого типа файла</p>
              <Button
                variant="default"
                onClick={handleDownload}
              >
                <Icon name="Download" className="h-4 w-4 mr-2" />
                Скачать файл
              </Button>
            </div>
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
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  useEffect(() => {
    if (open && selectedVerification) {
      loadUploadedDocuments();
    }
  }, [open, selectedVerification]);

  const loadUploadedDocuments = async () => {
    if (!selectedVerification) return;
    
    setLoadingDocuments(true);
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      const response = await fetch(funcUrl['get-documents'], {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(selectedVerification.userId),
          ...(jwtToken && { 'Authorization': `Bearer ${jwtToken}` }),
        },
        credentials: 'omit'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadedDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load uploaded documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleViewDocument = (url: string, title: string) => {
    setCurrentDocument({ url, title });
    setViewerOpen(true);
  };

  const handleDownloadAll = async () => {
    if (!selectedVerification) return;

    const zip = new JSZip();
    const documents: Array<{ url: string; name: string }> = [];

    if (selectedVerification.passportScanUrl) {
      documents.push({ url: selectedVerification.passportScanUrl, name: 'Скан_паспорта' });
    }
    if (selectedVerification.passportRegistrationUrl) {
      documents.push({ url: selectedVerification.passportRegistrationUrl, name: 'Страница_с_регистрацией' });
    }
    if (selectedVerification.utilityBillUrl) {
      documents.push({ url: selectedVerification.utilityBillUrl, name: 'Коммунальный_платеж' });
    }
    if (selectedVerification.registrationCertUrl) {
      documents.push({ url: selectedVerification.registrationCertUrl, name: 'Свидетельство_регистрации' });
    }
    if (selectedVerification.agreementFormUrl) {
      documents.push({ url: selectedVerification.agreementFormUrl, name: 'Форма_согласия' });
    }

    if (documents.length === 0) return;

    for (const doc of documents) {
      try {
        if (doc.url.startsWith('data:')) {
          const base64Data = doc.url.split(',')[1];
          const mimeType = doc.url.split(';')[0].split(':')[1];
          const extension = mimeType.includes('pdf') ? '.pdf' : '.png';
          zip.file(`${doc.name}${extension}`, base64Data, { base64: true });
        } else {
          const response = await fetch(doc.url);
          const blob = await response.blob();
          const extension = doc.url.match(/\.(jpg|jpeg|png|gif|webp|pdf)$/i)?.[0] || '.png';
          zip.file(`${doc.name}${extension}`, blob);
        }
      } catch (error) {
        console.error(`Failed to download ${doc.name}:`, error);
      }
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    const userName = `${selectedVerification.userLastName}_${selectedVerification.userFirstName}`.replace(/\s+/g, '_');
    link.download = `Документы_${userName}_${selectedVerification.id}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Документы верификации</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                disabled={!selectedVerification || (
                  !selectedVerification.passportScanUrl &&
                  !selectedVerification.passportRegistrationUrl &&
                  !selectedVerification.utilityBillUrl &&
                  !selectedVerification.registrationCertUrl &&
                  !selectedVerification.agreementFormUrl
                )}
              >
                <Icon name="Archive" className="h-4 w-4 mr-2" />
                Скачать все документы
              </Button>
            </DialogTitle>
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
                {loadingDocuments ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {uploadedDocuments.length > 0 ? (
                      uploadedDocuments.map((doc) => (
                        <div key={doc.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon name="FileText" className="h-5 w-5 text-primary" />
                              <div>
                                <span className="font-medium block">{doc.fileName || doc.fileType}</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(doc.uploadedAt).toLocaleString('ru-RU')}
                                </span>
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDocument(doc.fileUrl, doc.fileName || doc.fileType)}
                            >
                              <Icon name="Eye" className="h-4 w-4 mr-2" />
                              Просмотреть
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Документы не загружены
                      </p>
                    )}
                  </div>
                )}
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