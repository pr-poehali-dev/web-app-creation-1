import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import type { GoodsFormFieldsProps } from './types';

export default function GoodsFormFields({
  isEditMode,
  existingParsed,
  existingResponse,
  unit,
  quantity,
  pricePerUnit,
  uploadedCertificate,
  certificateFile,
  onCertificateChange,
  onRemoveUploadedCertificate,
  onRemoveCertificateFile,
}: GoodsFormFieldsProps) {
  return (
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

      <div>
        <Label className="text-sm">Сертификат на товар</Label>
        <div className="mt-1">
          {uploadedCertificate ? (
            <div className="flex items-center justify-between bg-muted px-2 py-1 rounded text-xs">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Icon name="FileText" className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{uploadedCertificate.name}</span>
                <span className="text-green-600 flex-shrink-0">(загружен)</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-2"
                onClick={onRemoveUploadedCertificate}
              >
                <Icon name="X" className="h-3 w-3" />
              </Button>
            </div>
          ) : certificateFile ? (
            <div className="flex items-center justify-between bg-muted px-2 py-1 rounded text-xs">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <Icon name="FileText" className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{certificateFile.name}</span>
                <span className="text-muted-foreground flex-shrink-0">
                  ({(certificateFile.size / 1024).toFixed(0)} КБ)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-2"
                onClick={onRemoveCertificateFile}
              >
                <Icon name="X" className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('certificate-upload')?.click()}
            >
              <Icon name="Upload" className="h-4 w-4 mr-1" />
              Загрузить сертификат
            </Button>
          )}
          <input
            id="certificate-upload"
            type="file"
            accept="image/*,.pdf"
            onChange={onCertificateChange}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Сертификат качества или соответствия (изображение или PDF, макс. 10 МБ)
          </p>
        </div>
      </div>
    </>
  );
}
