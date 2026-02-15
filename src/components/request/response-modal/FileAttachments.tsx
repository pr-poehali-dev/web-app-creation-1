import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import type { FileAttachmentsProps } from './types';

export default function FileAttachments({
  uploadedFiles,
  newFiles,
  isUploading,
  onFileChange,
  onRemoveNewFile,
  onRemoveUploadedFile,
}: FileAttachmentsProps) {
  return (
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
            onChange={onFileChange}
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
                  onClick={() => onRemoveUploadedFile(index)}
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
                  onClick={() => onRemoveNewFile(index)}
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
  );
}
