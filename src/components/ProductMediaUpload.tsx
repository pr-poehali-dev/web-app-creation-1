import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { uploadMultipleFiles } from '@/utils/fileUpload';

interface ProductMediaUploadProps {
  productImages: string[];
  productVideoUrl?: string;
  onImagesChange: (urls: string[]) => void;
  onVideoChange: (url: string) => void;
  maxImages?: number;
  maxVideoSizeMB?: number;
}

export default function ProductMediaUpload({
  productImages,
  productVideoUrl,
  onImagesChange,
  onVideoChange,
  maxImages = 5,
  maxVideoSizeMB = 100
}: ProductMediaUploadProps) {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const [recentlyUploadedImages, setRecentlyUploadedImages] = useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    if (productImages.length + files.length > maxImages) {
      setError(`Максимум ${maxImages} фотографий`);
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Необходима авторизация');
      return;
    }

    setError('');
    setUploadingImages(true);
    setUploadProgress(0);

    try {
      const newUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (!file.type.startsWith('image/')) {
          setError(`Файл ${file.name} не является изображением`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          setError(`Файл ${file.name} превышает 10 МБ`);
          continue;
        }

        const uploadResult = await uploadMultipleFiles([{ file, type: `image_${i}` }], userId);
        const uploadedUrl = Object.values(uploadResult)[0];
        if (uploadedUrl) {
          newUrls.push(uploadedUrl);
        }
        
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      onImagesChange([...productImages, ...newUrls]);
      setRecentlyUploadedImages(newUrls);
      setUploadSuccess(`Загружено ${newUrls.length} фото`);
      setTimeout(() => {
        setUploadSuccess('');
        setRecentlyUploadedImages([]);
      }, 3000);
    } catch (err) {
      setError('Ошибка загрузки изображений');
      console.error('Image upload error:', err);
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('Выбранный файл не является видео');
      return;
    }

    const maxSizeBytes = maxVideoSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`Видео не должно превышать ${maxVideoSizeMB} МБ`);
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Необходима авторизация');
      return;
    }

    setError('');
    setUploadingVideo(true);
    setUploadProgress(0);

    try {
      const uploadResult = await uploadMultipleFiles([{ file, type: 'product_video' }], userId);
      const uploadedUrl = Object.values(uploadResult)[0];
      if (uploadedUrl) {
        onVideoChange(uploadedUrl);
      }
      setUploadProgress(100);
      setUploadSuccess('Видео успешно загружено');
      setTimeout(() => setUploadSuccess(''), 3000);
    } catch (err) {
      setError('Ошибка загрузки видео');
      console.error('Video upload error:', err);
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const newImages = productImages.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const removeVideo = () => {
    onVideoChange('');
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <Icon name="AlertCircle" className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <Icon name="CheckCircle" className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{uploadSuccess}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Фотографии товара ({productImages.length}/{maxImages})</Label>
        <p className="text-xs text-muted-foreground">
          Загрузите до {maxImages} фотографий товара. Форматы: JPG, PNG. Максимум 10 МБ на фото.
        </p>

        {productImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {productImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Товар ${index + 1}`}
                  className={`w-full h-32 object-cover rounded-lg border ${
                    recentlyUploadedImages.includes(url) ? 'ring-2 ring-green-500 ring-offset-2' : ''
                  }`}
                />
                {recentlyUploadedImages.includes(url) && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1">
                    <Icon name="Check" className="h-4 w-4" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <Icon name="X" className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {productImages.length < maxImages && (
          <div>
            <input
              id="product-images"
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              multiple
              onChange={handleImageUpload}
              disabled={uploadingImages}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('product-images')?.click()}
              disabled={uploadingImages}
              className="w-full"
            >
              {uploadingImages ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка {uploadProgress}%...
                </>
              ) : (
                <>
                  <Icon name="ImagePlus" className="mr-2 h-4 w-4" />
                  Добавить фотографии
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Видео товара (необязательно)</Label>
        <p className="text-xs text-muted-foreground">
          Загрузите видео-обзор товара. Форматы: MP4, MOV, AVI. Максимум {maxVideoSizeMB} МБ.
        </p>

        {productVideoUrl && (
          <div className="relative group">
            <video
              src={productVideoUrl}
              controls
              className="w-full h-48 rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={removeVideo}
            >
              <Icon name="X" className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!productVideoUrl && (
          <div>
            <input
              id="product-video"
              type="file"
              accept="video/mp4,video/mov,video/avi,video/quicktime"
              onChange={handleVideoUpload}
              disabled={uploadingVideo}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('product-video')?.click()}
              disabled={uploadingVideo}
              className="w-full"
            >
              {uploadingVideo ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Загрузка видео {uploadProgress}%...
                </>
              ) : (
                <>
                  <Icon name="Video" className="mr-2 h-4 w-4" />
                  Добавить видео
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}