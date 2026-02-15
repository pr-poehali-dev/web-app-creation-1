import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { uploadFile } from '@/utils/fileUpload';
import type { ExistingResponse } from '@/pages/RequestDetail/useRequestResponse';
import type { UploadedFile } from './response-modal/types';
import ServiceFormFields from './response-modal/ServiceFormFields';
import GoodsFormFields from './response-modal/GoodsFormFields';
import FileAttachments from './response-modal/FileAttachments';

interface RequestResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  category: string;
  budget?: number;
  existingResponse?: ExistingResponse | null;
}

export default function RequestResponseModal({
  isOpen,
  onClose,
  onSubmit,
  quantity,
  unit,
  pricePerUnit,
  category,
  budget,
  existingResponse,
}: RequestResponseModalProps) {
  const isService = category === 'utilities';
  const isEditMode = !!existingResponse;
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [priceValue, setPriceValue] = useState('');
  const [education, setEducation] = useState('');
  const [diplomaFile, setDiplomaFile] = useState<File | null>(null);
  const [uploadedDiploma, setUploadedDiploma] = useState<UploadedFile | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploadedCertificate, setUploadedCertificate] = useState<UploadedFile | null>(null);
  
  useEffect(() => {
    if (isOpen && existingResponse) {
      const price = existingResponse.pricePerUnit;
      setPriceValue(price ? formatNumber(String(price)) : '');
      setUploadedFiles(existingResponse.attachments || []);
      setNewFiles([]);
      const ext = existingResponse as ExistingResponse & { education?: string; diploma?: UploadedFile; certificate?: UploadedFile };
      setEducation(ext.education || '');
      setUploadedDiploma(ext.diploma || null);
      setDiplomaFile(null);
      setUploadedCertificate(ext.certificate || null);
      setCertificateFile(null);
    } else if (isOpen && !existingResponse) {
      const defaultPrice = isService ? budget : pricePerUnit;
      setPriceValue(defaultPrice ? formatNumber(String(defaultPrice)) : '');
      setUploadedFiles([]);
      setNewFiles([]);
      setEducation('');
      setUploadedDiploma(null);
      setDiplomaFile(null);
      setUploadedCertificate(null);
      setCertificateFile(null);
    }
  }, [isOpen, existingResponse]);
  
  const formatNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setPriceValue(formatted);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCount = uploadedFiles.length + newFiles.length + files.length;
    
    if (totalCount > 5) {
      toast.error('Можно прикрепить максимум 5 файлов');
      return;
    }
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Файл ${file.name} слишком большой (макс. 10 МБ)`);
        return;
      }
    }
    
    setNewFiles(prev => [...prev, ...files]);
  };

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDiplomaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 10 МБ)');
      return;
    }
    setDiplomaFile(file);
    setUploadedDiploma(null);
  };

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Файл слишком большой (макс. 10 МБ)');
      return;
    }
    setCertificateFile(file);
    setUploadedCertificate(null);
  };

  const parseExistingComment = () => {
    if (!existingResponse?.buyerComment) return { deliveryDays: '', comment: '' };
    const match = existingResponse.buyerComment.match(/Срок поставки: (\d+) дней\.\s*(.*)/s);
    if (match) {
      return { deliveryDays: match[1], comment: match[2].trim() };
    }
    return { deliveryDays: '', comment: existingResponse.buyerComment };
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const allAttachments = [...uploadedFiles];
    
    setIsUploading(true);
    
    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      
      for (const file of newFiles) {
        const url = await uploadFile(file, 'response_attachment', userId);
        allAttachments.push({ url, name: file.name });
      }

      let diplomaData = uploadedDiploma;
      if (diplomaFile) {
        const url = await uploadFile(diplomaFile, 'diploma', userId);
        diplomaData = { url, name: diplomaFile.name };
      }

      let certificateData = uploadedCertificate;
      if (certificateFile) {
        const url = await uploadFile(certificateFile, 'certificate', userId);
        certificateData = { url, name: certificateFile.name };
      }

      if (newFiles.length > 0 || diplomaFile || certificateFile) {
        toast.success('Файлы загружены!');
      }
      setIsUploading(false);
      
      const form = e.target as HTMLFormElement;

      const setHiddenInput = (name: string, value: string) => {
        let input = form.querySelector(`input[name="${name}"]`) as HTMLInputElement;
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          form.appendChild(input);
        }
        input.value = value;
      };

      setHiddenInput('response-attachments', JSON.stringify(allAttachments));
      
      if (isService) {
        setHiddenInput('response-education', education);
        setHiddenInput('response-diploma', JSON.stringify(diplomaData));
      } else {
        setHiddenInput('response-certificate', JSON.stringify(certificateData));
      }
      
      onSubmit(e);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Ошибка загрузки файлов');
      setIsUploading(false);
    }
  };

  const existingParsed = parseExistingComment();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">
            {isEditMode ? 'Редактировать отклик' : 'Отправить отклик'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditMode 
              ? 'Измените данные вашего отклика' 
              : 'Заполните форму отклика, и автор запроса свяжется с вами'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-3">
          {isService ? (
            <ServiceFormFields
              isEditMode={isEditMode}
              existingParsed={existingParsed}
              priceValue={priceValue}
              onPriceChange={handlePriceChange}
              budget={budget}
              education={education}
              onEducationChange={setEducation}
              uploadedDiploma={uploadedDiploma}
              diplomaFile={diplomaFile}
              onDiplomaChange={handleDiplomaChange}
              onRemoveUploadedDiploma={() => setUploadedDiploma(null)}
              onRemoveDiplomaFile={() => setDiplomaFile(null)}
            />
          ) : (
            <GoodsFormFields
              isEditMode={isEditMode}
              existingParsed={existingParsed}
              existingResponse={existingResponse}
              unit={unit}
              quantity={quantity}
              pricePerUnit={pricePerUnit}
              uploadedCertificate={uploadedCertificate}
              certificateFile={certificateFile}
              onCertificateChange={handleCertificateChange}
              onRemoveUploadedCertificate={() => setUploadedCertificate(null)}
              onRemoveCertificateFile={() => setCertificateFile(null)}
            />
          )}

          <FileAttachments
            uploadedFiles={uploadedFiles}
            newFiles={newFiles}
            isUploading={isUploading}
            onFileChange={handleFileChange}
            onRemoveNewFile={removeNewFile}
            onRemoveUploadedFile={removeUploadedFile}
          />

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isUploading}>
              {isUploading ? 'Загрузка...' : isEditMode ? 'Сохранить изменения' : 'Отправить отклик'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Отмена
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
