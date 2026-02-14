import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { uploadFile } from '@/utils/fileUpload';
import type { ExistingResponse } from '@/pages/RequestDetail/useRequestResponse';

interface RequestResponseFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
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

export default function RequestResponseForm({
  onSubmit,
  onCancel,
  quantity,
  unit,
  pricePerUnit,
  category,
  budget,
  existingResponse,
}: RequestResponseFormProps) {
  const isService = category === 'utilities';
  const isEditMode = !!existingResponse;
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [priceValue, setPriceValue] = useState('');

  useEffect(() => {
    if (existingResponse) {
      const price = existingResponse.pricePerUnit;
      setPriceValue(price ? formatNumber(String(price)) : '');
      setUploadedFiles(existingResponse.attachments || []);
      setNewFiles([]);
    } else {
      setPriceValue('');
      setUploadedFiles([]);
      setNewFiles([]);
    }
  }, [existingResponse]);

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
    if (!existingResponse?.buyerComment) return { deliveryDays: '', comment: '', education: '' };
    const cleaned = existingResponse.buyerComment
      .replace(/\n?\n?Прикрепленные файлы:[\s\S]*$/, '')
      .trim();
    const match = cleaned.match(/Срок (?:поставки|выполнения): (\d+) дней\.\s*(?:Образование: ([^\n]*)\n?)?\s*(.*)/s);
    if (match) {
      return { deliveryDays: match[1], education: match[2]?.trim() || '', comment: match[3].trim() };
    }
    return { deliveryDays: '', education: '', comment: cleaned };
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon name={isEditMode ? 'Pencil' : 'Send'} className="h-4 w-4" />
          {isEditMode ? 'Редактировать отклик' : 'Отправить отклик'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? 'Измените данные вашего отклика'
            : 'Заполните форму, и автор запроса свяжется с вами'}
        </p>
      </CardHeader>
      <CardContent>
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
                  placeholder={budget ? `Бюджет: ${budget.toLocaleString('ru-RU')} ₽` : 'Укажите стоимость'}
                  required
                  className="h-9 mt-1"
                />
                <input
                  type="hidden"
                  name="response-price-value"
                  value={priceValue.replace(/\s/g, '')}
                />
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
                  placeholder="Укажите срок"
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
                  placeholder="Расскажите о вашем опыте и условиях"
                  rows={3}
                  className="text-sm mt-1"
                />
              </div>

              <div>
                <Label htmlFor="response-education" className="text-sm">
                  Образование
                  <span className="text-muted-foreground font-normal ml-1">(необязательно)</span>
                </Label>
                <Input
                  id="response-education"
                  name="response-education"
                  type="text"
                  defaultValue={isEditMode ? existingParsed.education : undefined}
                  placeholder="Например: МГУ, экономический факультет"
                  className="h-9 mt-1"
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
                <Label htmlFor="response-price" className="text-sm">Цена за единицу (₽)</Label>
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
                  placeholder="Укажите срок"
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
                  placeholder="Дополнительная информация"
                  rows={2}
                  className="text-sm mt-1"
                />
              </div>
            </>
          )}

          <div>
            <Label className="text-sm">Портфолио и документы</Label>
            <div className="mt-1 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('inline-file-upload')?.click()}
                disabled={isUploading}
              >
                <Icon name="Paperclip" className="h-4 w-4 mr-1" />
                Прикрепить файлы
              </Button>
              <input
                id="inline-file-upload"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploadedFiles.length > 0 && (
                <div className="space-y-1">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={`uploaded-${index}`}
                      className="flex items-center justify-between bg-muted px-2 py-1 rounded text-xs"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 flex-1 min-w-0 hover:text-primary transition-colors cursor-pointer"
                      >
                        <Icon name="File" className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate underline">{file.name}</span>
                      </a>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 ml-2 flex-shrink-0"
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
                До 5 файлов, макс. 10 МБ каждый
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={isUploading}>
              {isUploading ? 'Загрузка...' : isEditMode ? 'Сохранить' : 'Отправить отклик'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isUploading}
            >
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}