import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface DocumentUploadSectionProps {
  verificationType: string;
  documentTypes: string[];
  documents: Record<string, File>;
  uploadingDocs: Record<string, boolean>;
  addressMatchesRegistration: boolean;
  onAddressMatchChange: (checked: boolean) => void;
  onFileChange: (docType: string, file: File | null) => void;
}

const DOCUMENT_LABELS: Record<string, string> = {
  passportScan: 'Скан паспорта',
  passportRegistration: 'Скан прописки',
  utilityBill: 'Счёт за коммунальные услуги',
  registrationCert: 'Свидетельство о регистрации',
  agreementForm: 'Форма согласия',
};

export default function DocumentUploadSection({
  verificationType,
  documentTypes,
  documents,
  uploadingDocs,
  addressMatchesRegistration,
  onAddressMatchChange,
  onFileChange,
}: DocumentUploadSectionProps) {
  const getDocumentLabel = (docType: string) => {
    return DOCUMENT_LABELS[docType] || docType;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Загрузите обновленные документы</h3>
      
      {verificationType === 'individual' && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg border">
            <input
              type="checkbox"
              id="addressMatch"
              checked={addressMatchesRegistration}
              onChange={(e) => onAddressMatchChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <Label 
              htmlFor="addressMatch" 
              className="text-sm font-normal cursor-pointer flex items-center gap-2"
            >
              <Icon name="Home" className="h-4 w-4 text-muted-foreground" />
              Место жительства совпадает с местом регистрации
            </Label>
          </div>
          
          {addressMatchesRegistration && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200">
              <Icon name="Info" className="h-4 w-4 mt-0.5 text-green-600" />
              <p>Квитанция за коммунальные услуги не требуется, так как адреса совпадают</p>
            </div>
          )}
        </div>
      )}
      
      {documentTypes.map(docType => (
        <div key={docType} className="space-y-2">
          <Label htmlFor={docType}>{getDocumentLabel(docType)}</Label>
          <div className="flex items-center gap-2">
            <input
              id={docType}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => onFileChange(docType, e.target.files?.[0] || null)}
              disabled={uploadingDocs[docType]}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
            {uploadingDocs[docType] && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            )}
            {documents[docType] && (
              <Icon name="CheckCircle" className="h-5 w-5 text-green-600" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
