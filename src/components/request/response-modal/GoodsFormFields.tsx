import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import type { GoodsFormFieldsProps } from './types';

interface NumberStepperProps {
  id: string;
  name: string;
  min: number;
  max?: number;
  defaultValue?: number;
  required?: boolean;
}

function NumberStepper({ id, name, min, max, defaultValue, required }: NumberStepperProps) {
  const [rawValue, setRawValue] = useState<string>(String(defaultValue ?? min));
  const [error, setError] = useState<string>('');

  const numValue = parseFloat(rawValue) || 0;

  const validate = (val: number) => {
    if (rawValue === '') {
      setError('Введите значение');
      return false;
    }
    if (max !== undefined && val > max) {
      setError(`Значение должно быть не больше ${max}`);
      return false;
    }
    if (val < min) {
      setError(`Значение должно быть не меньше ${min}`);
      return false;
    }
    setError('');
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setRawValue(raw);
    if (raw === '') {
      setError('Введите значение');
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) validate(num);
  };

  const handleBlur = () => {
    if (rawValue === '' || isNaN(parseFloat(rawValue))) {
      setRawValue(String(min));
      setError('');
    }
  };

  const step = (delta: number) => {
    const next = numValue + delta;
    if (max !== undefined && next > max) {
      setRawValue(String(max));
      setError(`Значение должно быть не больше ${max}`);
      return;
    }
    if (next < min) {
      setRawValue(String(min));
      setError(`Значение должно быть не меньше ${min}`);
      return;
    }
    setRawValue(String(next));
    setError('');
  };

  return (
    <div>
      <div className="flex items-center mt-1 h-9">
        <button
          type="button"
          onClick={() => step(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-95 transition-transform flex-shrink-0 select-none"
          aria-label="Уменьшить"
        >
          <Icon name="Minus" size={14} />
        </button>
        <input
          id={id}
          name={name}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={rawValue}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          className="flex-1 h-9 border border-input bg-background px-2 text-center text-sm focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          style={{ minWidth: 0 }}
        />
        <button
          type="button"
          onClick={() => step(1)}
          className="flex items-center justify-center w-9 h-9 rounded-r-md border border-l-0 border-input bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-95 transition-transform flex-shrink-0 select-none"
          aria-label="Увеличить"
        >
          <Icon name="Plus" size={14} />
        </button>
      </div>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}

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
  const [showCertMenu, setShowCertMenu] = useState(false);
  const certFileRef = useRef<HTMLInputElement>(null);
  const certCameraRef = useRef<HTMLInputElement>(null);

  const handleCertOption = (type: 'file' | 'camera') => {
    setShowCertMenu(false);
    if (type === 'file') certFileRef.current?.click();
    else certCameraRef.current?.click();
  };

  return (
    <>
      <div>
        <Label htmlFor="response-quantity" className="text-sm">Количество ({unit})</Label>
        <NumberStepper
          id="response-quantity"
          name="response-quantity"
          min={1}
          max={quantity}
          defaultValue={isEditMode ? existingResponse?.quantity : quantity}
          required
        />
      </div>

      <div>
        <Label htmlFor="response-price" className="text-sm">Ваша цена за единицу (₽)</Label>
        <NumberStepper
          id="response-price"
          name="response-price"
          min={1}
          defaultValue={isEditMode ? existingResponse?.pricePerUnit : pricePerUnit}
          required
        />
      </div>

      <div>
        <Label htmlFor="response-delivery" className="text-sm">Срок поставки (дней)</Label>
        <NumberStepper
          id="response-delivery"
          name="response-delivery"
          min={1}
          defaultValue={isEditMode ? parseInt(existingParsed.deliveryDays) || undefined : undefined}
          required
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
            <div className="relative inline-block">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCertMenu(!showCertMenu)}
              >
                <Icon name="Upload" className="h-4 w-4 mr-1" />
                Загрузить сертификат
                <Icon name="ChevronDown" className="h-3 w-3 ml-1" />
              </Button>

              {showCertMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowCertMenu(false)}
                  />
                  <div className="absolute z-20 left-0 mt-1 w-52 bg-background border border-input rounded-md shadow-lg">
                    <button
                      type="button"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
                      onClick={() => handleCertOption('file')}
                    >
                      <Icon name="FolderOpen" className="h-4 w-4 text-muted-foreground" />
                      Выбрать из файлов
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
                      onClick={() => handleCertOption('camera')}
                    >
                      <Icon name="Camera" className="h-4 w-4 text-muted-foreground" />
                      Снять фото с камеры
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <input
            ref={certFileRef}
            type="file"
            accept="image/*,.pdf"
            onChange={onCertificateChange}
            className="hidden"
          />
          <input
            ref={certCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
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