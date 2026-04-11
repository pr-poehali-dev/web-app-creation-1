import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { uploadMultipleFiles } from '@/utils/fileUpload';

interface ContractPhotoUploadProps {
  images: string[];
  onChange: (urls: string[]) => void;
  label: string;
  maxImages?: number;
}

export default function ContractPhotoUpload({ images, onChange, label, maxImages = 5 }: ContractPhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > maxImages) {
      setError(`Максимум ${maxImages} фотографий`);
      return;
    }
    const userId = localStorage.getItem('userId');
    if (!userId) { setError('Необходима авторизация'); return; }
    setError('');
    setUploading(true);
    setProgress(0);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) { setError(`${file.name} — не изображение`); continue; }
        if (file.size > 10 * 1024 * 1024) { setError(`${file.name} превышает 10 МБ`); continue; }
        const res = await uploadMultipleFiles([{ file, type: `product_img_${i}` }], userId);
        const url = Object.values(res)[0];
        if (url) newUrls.push(url);
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
      onChange([...images, ...newUrls]);
    } catch {
      setError('Ошибка загрузки');
    } finally {
      setUploading(false);
      setProgress(0);
      e.target.value = '';
    }
  };

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Icon name="Camera" size={14} />
        {label} ({images.length}/{maxImages})
      </Label>
      <p className="text-xs text-muted-foreground">JPG, PNG, WebP — до 10 МБ на фото</p>
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((url, idx) => (
            <div key={idx} className="relative group aspect-square">
              <img src={url} alt={`Фото ${idx + 1}`} className="w-full h-full object-cover rounded-lg border" />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Icon name="X" size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      {images.length < maxImages && (
        <>
          <input
            id={`photo-upload-${label}`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            disabled={uploading}
            onClick={() => document.getElementById(`photo-upload-${label}`)?.click()}
          >
            {uploading ? (
              <><Icon name="Loader2" size={14} className="mr-2 animate-spin" />Загрузка {progress}%...</>
            ) : (
              <><Icon name="ImagePlus" size={14} className="mr-2" />Добавить фото</>
            )}
          </Button>
        </>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
