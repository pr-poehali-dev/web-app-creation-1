import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadWithIndicatorProps {
  id: string;
  label: string;
  accept?: string;
  required?: boolean;
  helpText?: string;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

export default function FileUploadWithIndicator({
  id,
  label,
  accept = 'image/*,.pdf',
  required = false,
  helpText,
  onChange,
  disabled = false
}: FileUploadWithIndicatorProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError('');
    
    if (!file) {
      setSelectedFile(null);
      onChange(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`Размер файла не должен превышать 5 МБ. Ваш файл: ${(file.size / 1024 / 1024).toFixed(2)} МБ`);
      e.target.value = '';
      setSelectedFile(null);
      onChange(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Недопустимый формат файла. Разрешены: JPEG, PNG, GIF, WebP, PDF. Ваш файл: ${file.type || 'неизвестный'}`);
      e.target.value = '';
      setSelectedFile(null);
      onChange(null);
      return;
    }

    setSelectedFile(file);
    onChange(file);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        {label} {required && '*'}
        {uploadSuccess && (
          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-normal">
            <Icon name="CheckCircle" className="h-3 w-3" />
            Файл выбран
          </span>
        )}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          required={required}
          disabled={disabled}
          className={uploadSuccess ? 'border-green-500 bg-green-50' : ''}
        />
        {selectedFile && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon name="Check" className="h-5 w-5 text-green-600" />
          </div>
        )}
      </div>
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
      {selectedFile && !error && (
        <p className="text-xs text-green-600">
          {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)
        </p>
      )}
    </div>
  );
}