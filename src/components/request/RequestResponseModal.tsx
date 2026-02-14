import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { uploadFile } from '@/utils/fileUpload';
import type { ExistingResponse } from '@/pages/RequestDetail/useRequestResponse';

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

interface UploadedFile {
  url: string;
  name: string;
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
  
  useEffect(() => {
    if (isOpen && existingResponse) {
      const price = existingResponse.pricePerUnit;
      setPriceValue(price ? formatNumber(String(price)) : '');
      setUploadedFiles(existingResponse.attachments || []);
      setNewFiles([]);
    } else if (isOpen && !existingResponse) {
      setPriceValue('');
      setUploadedFiles([]);
      setNewFiles([]);
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
    
    if (newFiles.length > 0) {
      setIsUploading(true);
      toast.info('Загрузка файлов...');
      
      try {
        const userId = localStorage.getItem('userId') || 'anonymous';
        
        for (const file of newFiles) {
          const url = await uploadFile(file, 'response_attachment', userId);
          allAttachments.push({ url, name: file.name });
        }
        
        toast.success('Файлы загружены!');
        setIsUploading(false);
      } catch (error) {
        console.error('File upload error:', error);
        toast.error('Ошибка загрузки файлов');
        setIsUploading(false);
        return;
      }
    }
    
    const form = e.target as HTMLFormElement;
    let attachmentsInput = form.querySelector('input[name="response-attachments"]') as HTMLInputElement;
    if (!attachmentsInput) {
      attachmentsInput = document.createElement('input');
      attachmentsInput.type = 'hidden';
      attachmentsInput.name = 'response-attachments';
      form.appendChild(attachmentsInput);
    }
    attachmentsInput.value = JSON.stringify(allAttachments);
    
    onSubmit(e);
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
            <>
              <div>
                <Label htmlFor="response-price" className="text-sm">
                  Стоимость услуги (₽)
                </Label>
                <Input
                  id="response-price"
                  name="response-price"
                  type="text"
                  value={priceValue}
                  onChange={handlePriceChange}
                  placeholder={budget ? `Бюджет заказчика: ${budget.toLocaleString('ru-RU')} ₽` : 'Укажите стоимость'}
                  required
                  className="h-9 mt-1"
                />
                <input 
                  type="hidden" 
                  name="response-price-value" 
                  value={priceValue.replace(/\s/g, '')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Укажите полную стоимость выполнения работ
                </p>
              </div>

              <div>
                <Label htmlFor="response-delivery" className="text-sm">
                  Срок выполнения (дней)
                </Label>
                <Input
                  id="response-delivery"
                  name="response-delivery"
                  type="number"
                  min="1"
                  defaultValue={isEditMode ? existingParsed.deliveryDays : undefined}
                  placeholder="Укажите срок выполнения"
                  required
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="response-comment" className="text-sm">Опыт и комментарий</Label>
                <Textarea
                  id="response-comment"
                  name="response-comment"
                  defaultValue={isEditMode ? existingParsed.comment : undefined}
                  placeholder="Расскажите о вашем опыте, условиях работы и других деталях"
                  rows={3}
                  className="text-sm mt-1"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="response-quantity" className="text-sm">Количество ({unit})</Label>
                <Input
                  id="response-quantity"
                  name="response-quantity"
                  type="number"
                  min="1"
                  max={quantity}
                  defaultValue={isEditMode ? existingResponse?.quantity : quantity}
                  required
                  className="h-9 mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="response-price" className="text-sm">Ваша цена за единицу (₽)</Label>
                <Input
                  id="response-price"
                  name="response-price"
                  type="number"
                  min="1"
                  defaultValue={isEditMode ? existingResponse?.pricePerUnit : pricePerUnit}
                  required
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="response-delivery" className="text-sm">Срок поставки (дней)</Label>
                <Input
                  id="response-delivery"
                  name="response-delivery"
                  type="number"
                  min="1"
                  defaultValue={isEditMode ? existingParsed.deliveryDays : undefined}
                  placeholder="Укажите срок поставки"
                  required
                  className="h-9 mt-1"
                />
              </div>

              <div>
                <Label htmlFor="response-comment" className="text-sm">Комментарий</Label>
                <Textarea
                  id="response-comment"
                  name="response-comment"
                  defaultValue={isEditMode ? existingParsed.comment : undefined}
                  placeholder="Дополнительная информация о вашем предложении"
                  rows={2}
                  className="text-sm mt-1"
                />
              </div>
            </>
          )}

          <div>
            <Label className="text-sm">Портфолио и документы</Label>
            <div className="mt-1 space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="relative"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isUploading}
                >
                  <Icon name="Paperclip" className="h-4 w-4 mr-1" />
                  Прикрепить файлы
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              
              {uploadedFiles.length > 0 && (
                <div className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={`uploaded-${index}`}
                      className="flex items-center justify-between bg-muted px-2 py-1 rounded text-xs"
                    >
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Icon name="File" className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-green-600 flex-shrink-0">
                          (загружен)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-2"
                        onClick={() => removeUploadedFile(index)}
                      >
                        <Icon name="X" className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {newFiles.length > 0 && (
                <div className="space-y-1">
                  {newFiles.map((file, index) => (
                    <div
                      key={`new-${index}`}
                      className="flex items-center justify-between bg-muted px-2 py-1 rounded text-xs"
                    >
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Icon name="File" className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-muted-foreground flex-shrink-0">
                          ({(file.size / 1024).toFixed(0)} КБ)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-2"
                        onClick={() => removeNewFile(index)}
                      >
                        <Icon name="X" className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Прикрепите фото работ, сертификаты или документы (до 5 файлов, макс. 10 МБ каждый)
              </p>
            </div>
          </div>

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
