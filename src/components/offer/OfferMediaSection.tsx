import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface OfferMediaSectionProps {
  images: File[];
  imagePreviews: string[];
  video: File | null;
  videoPreview: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
}

export default function OfferMediaSection({
  images,
  imagePreviews,
  video,
  videoPreview,
  onImageUpload,
  onRemoveImage,
  onVideoUpload,
  onRemoveVideo
}: OfferMediaSectionProps) {
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [imageUploadSuccess, setImageUploadSuccess] = useState(false);
  const [videoUploadSuccess, setVideoUploadSuccess] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsImageUploading(true);
    setImageUploadSuccess(false);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onImageUpload(e);
    
    setIsImageUploading(false);
    setImageUploadSuccess(true);
    setTimeout(() => setImageUploadSuccess(false), 3000);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsVideoUploading(true);
    setVideoUploadSuccess(false);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onVideoUpload(e);
    
    setIsVideoUploading(false);
    setVideoUploadSuccess(true);
    setTimeout(() => setVideoUploadSuccess(false), 3000);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Медиа</CardTitle>
        <CardDescription>
          Загрузите фотографии и видео (до 10 фото + 1 видео)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="images" className="flex items-center gap-2">
            Фотографии (до 10)
            {isImageUploading && (
              <span className="inline-flex items-center gap-1 text-primary text-xs font-normal">
                <Icon name="Loader2" className="h-3 w-3 animate-spin" />
                Загрузка...
              </span>
            )}
            {imageUploadSuccess && (
              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-normal">
                <Icon name="CheckCircle" className="h-3 w-3" />
                Загружено
              </span>
            )}
          </Label>
          <div className="mt-2">
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={images.length >= 10 || isImageUploading}
              className={imageUploadSuccess ? 'border-green-500 bg-green-50' : ''}
            />
          </div>
          
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemoveImage(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                  >
                    <Icon name="X" className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="video" className="flex items-center gap-2">
            Видео (1 файл)
            {isVideoUploading && (
              <span className="inline-flex items-center gap-1 text-primary text-xs font-normal">
                <Icon name="Loader2" className="h-3 w-3 animate-spin" />
                Загрузка...
              </span>
            )}
            {videoUploadSuccess && (
              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-normal">
                <Icon name="CheckCircle" className="h-3 w-3" />
                Загружено
              </span>
            )}
          </Label>
          <div className="mt-2">
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={!!video || isVideoUploading}
              className={videoUploadSuccess ? 'border-green-500 bg-green-50' : ''}
            />
          </div>
          
          {videoPreview && (
            <div className="relative aspect-video rounded-lg overflow-hidden border mt-4 max-w-md">
              <video
                src={videoPreview}
                controls
                className="w-full h-full"
              />
              <button
                type="button"
                onClick={onRemoveVideo}
                className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
              >
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}