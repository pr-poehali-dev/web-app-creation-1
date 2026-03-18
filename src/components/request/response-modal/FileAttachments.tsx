import { useState, useRef } from 'react';
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
  const [showMenu, setShowMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraPhotoRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLInputElement>(null);

  const handleMenuOption = (type: 'file' | 'photo' | 'video') => {
    setShowMenu(false);
    if (type === 'file') fileInputRef.current?.click();
    else if (type === 'photo') cameraPhotoRef.current?.click();
    else if (type === 'video') cameraVideoRef.current?.click();
  };

  return (
    <div>
      <Label className="text-sm">Портфолио и документы</Label>
      <div className="mt-1 space-y-2">
        <div className="relative inline-block">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowMenu(!showMenu)}
            disabled={isUploading}
          >
            <Icon name="Paperclip" className="h-4 w-4 mr-1" />
            Прикрепить файлы
            <Icon name="ChevronDown" className="h-3 w-3 ml-1" />
          </Button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute z-20 left-0 mt-1 w-52 bg-background border border-input rounded-md shadow-lg">
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
                  onClick={() => handleMenuOption('file')}
                >
                  <Icon name="FolderOpen" className="h-4 w-4 text-muted-foreground" />
                  Выбрать из файлов
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
                  onClick={() => handleMenuOption('photo')}
                >
                  <Icon name="Camera" className="h-4 w-4 text-muted-foreground" />
                  Снять фото с камеры
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left"
                  onClick={() => handleMenuOption('video')}
                >
                  <Icon name="Video" className="h-4 w-4 text-muted-foreground" />
                  Записать видео
                </button>
              </div>
            </>
          )}
        </div>

        {/* Скрытые инпуты */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,video/*"
          onChange={onFileChange}
          className="hidden"
        />
        <input
          ref={cameraPhotoRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
        />
        <input
          ref={cameraVideoRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={onFileChange}
          className="hidden"
        />

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
