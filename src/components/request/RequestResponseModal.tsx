import { useState } from 'react';
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

interface RequestResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  category: string;
  budget?: number;
}

export default function RequestResponseModal({
  isOpen,
  onClose,
  onSubmit,
  quantity,
  unit,
  pricePerUnit,
  category,
  budget
}: RequestResponseModalProps) {
  const isService = category === 'utilities';
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [priceValue, setPriceValue] = useState('');
  
  const formatNumber = (value: string) => {
    // Убираем все кроме цифр
    const numbers = value.replace(/\D/g, '');
    // Форматируем с пробелами
    return numbers.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setPriceValue(formatted);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Проверка количества и размера
    if (attachments.length + files.length > 5) {
      toast.error('Можно прикрепить максимум 5 файлов');
      return;
    }
    
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Файл ${file.name} слишком большой (макс. 10 МБ)`);
        return;
      }
    }
    
    setAttachments(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (attachments.length > 0 && isService) {
      setIsUploading(true);
      toast.info('Загрузка файлов...');
      
      try {
        const userId = localStorage.getItem('userId') || 'anonymous';
        const uploadedUrls: string[] = [];
        
        for (const file of attachments) {
          const url = await uploadFile(file, 'response_attachment', userId);
          uploadedUrls.push(url);
        }
        
        const form = e.target as HTMLFormElement;
        const commentField = form.querySelector('#response-comment') as HTMLTextAreaElement;
        const currentComment = commentField.value;
        const filesText = '\n\nПрикрепленные файлы:\n' + uploadedUrls.map((url, i) => `${i + 1}. ${url}`).join('\n');
        commentField.value = currentComment + filesText;
        
        toast.success('Файлы загружены!');
        setIsUploading(false);
      } catch (error) {
        console.error('File upload error:', error);
        toast.error('Ошибка загрузки файлов');
        setIsUploading(false);
        return;
      }
    }
    
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Отправить отклик</DialogTitle>
          <DialogDescription className="text-sm">
            Заполните форму отклика, и автор запроса свяжется с вами
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleFormSubmit} className="space-y-3">
          {isService ? (
            <>
              {/* Форма для услуг */}
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
                  placeholder="Расскажите о вашем опыте, условиях работы и других деталях"
                  rows={3}
                  className="text-sm mt-1"
                />
              </div>

              {/* Загрузка файлов для услуг */}
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
                  
                  {attachments.length > 0 && (
                    <div className="space-y-1">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
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
                            onClick={() => removeFile(index)}
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
            </>
          ) : (
            <>
              {/* Форма для товаров */}
              <div>
                <Label htmlFor="response-quantity" className="text-sm">Количество ({unit})</Label>
                <Input
                  id="response-quantity"
                  name="response-quantity"
                  type="number"
                  min="1"
                  max={quantity}
                  defaultValue={quantity}
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
                  defaultValue={pricePerUnit}
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
                  placeholder="Дополнительная информация о вашем предложении"
                  rows={2}
                  className="text-sm mt-1"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isUploading}>
              {isUploading ? 'Загрузка...' : 'Отправить отклик'}
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