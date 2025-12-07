import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  const [preview, setPreview] = useState<string>('');
  const [showFullPreview, setShowFullPreview] = useState(false);

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

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
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
        <div className="space-y-2">
          <p className="text-xs text-green-600">
            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)
          </p>
          {preview && (
            <>
              <div className="relative rounded-lg border border-green-200 overflow-hidden bg-white group cursor-pointer">
                <img 
                  src={preview} 
                  alt="Предпросмотр" 
                  className="w-full h-auto max-h-64 object-contain"
                  onClick={() => setShowFullPreview(true)}
                />
                <div 
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center"
                  onClick={() => setShowFullPreview(true)}
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-3">
                    <Icon name="ZoomIn" className="h-6 w-6 text-gray-900" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setPreview('');
                    onChange(null);
                    const input = document.getElementById(id) as HTMLInputElement;
                    if (input) input.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors shadow-lg z-10"
                >
                  <Icon name="X" className="h-4 w-4" />
                </button>
              </div>

              <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
                  <div className="relative w-full h-full flex items-center justify-center bg-black/95 rounded-lg overflow-hidden">
                    <img 
                      src={preview} 
                      alt="Полный просмотр" 
                      className="max-w-full max-h-[90vh] object-contain"
                    />
                    <button
                      onClick={() => setShowFullPreview(false)}
                      className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                    >
                      <Icon name="X" className="h-6 w-6" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                      {selectedFile.name}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          {selectedFile.type === 'application/pdf' && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50">
              <Icon name="FileText" className="h-8 w-8 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">PDF документ</p>
                <p className="text-xs text-green-600">Готов к загрузке</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}