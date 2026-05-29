import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface AuctionMediaSectionProps {
  imagePreviews: string[];
  videoPreview: string;
  isUploadingImages: boolean;
  isUploadingVideo: boolean;
  imageUploadProgress: string;
  videoUploadProgress: number;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
}

export default function AuctionMediaSection({
  imagePreviews,
  videoPreview,
  isUploadingImages,
  isUploadingVideo,
  imageUploadProgress,
  videoUploadProgress,
  onImageUpload,
  onRemoveImage,
  onVideoUpload,
  onRemoveVideo,
}: AuctionMediaSectionProps) {
  const [imgSuccess, setImgSuccess] = useState(false);
  const [vidSuccess, setVidSuccess] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onImageUpload(e);
    setImgSuccess(false);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVideoUpload(e);
    setVidSuccess(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Медиа *</CardTitle>
        <CardDescription>
          До 10 фото до 100 МБ каждое + 1 видео до 100 МБ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Фотографии */}
        <div>
          <Label className="flex items-center gap-2">
            Фотографии
            {isUploadingImages && (
              <span className="inline-flex items-center gap-1 text-primary text-xs font-normal">
                <Icon name="Loader2" className="h-3 w-3 animate-spin" />
                {imageUploadProgress}
              </span>
            )}
          </Label>
          <div className="flex gap-2 flex-wrap mt-2">
            <input
              id="auction-camera"
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleImageChange}
              disabled={imagePreviews.length >= 10 || isUploadingImages}
              className="hidden"
            />
            <label
              htmlFor="auction-camera"
              className={`inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                imagePreviews.length >= 10 || isUploadingImages
                  ? 'opacity-50 pointer-events-none'
                  : 'hover:bg-accent'
              } border-input bg-background`}
            >
              <Icon name="Camera" className="h-4 w-4" />
              Камера
            </label>

            <input
              id="auction-gallery"
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              disabled={imagePreviews.length >= 10 || isUploadingImages}
              className="hidden"
            />
            <label
              htmlFor="auction-gallery"
              className={`inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                imagePreviews.length >= 10 || isUploadingImages
                  ? 'opacity-50 pointer-events-none'
                  : 'hover:bg-accent'
              } border-input bg-background`}
            >
              <Icon name="Images" className="h-4 w-4" />
              Галерея
            </label>

            <span className="self-center text-xs text-muted-foreground">
              {imagePreviews.length}/10
            </span>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-3">
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

        {/* Видео */}
        <div>
          <Label className="flex items-center gap-2">
            Видео (необязательно)
            {isUploadingVideo && (
              <span className="inline-flex items-center gap-1 text-primary text-xs font-normal">
                <Icon name="Loader2" className="h-3 w-3 animate-spin" />
                {videoUploadProgress > 0 ? `${videoUploadProgress}%` : 'Загрузка...'}
              </span>
            )}
          </Label>
          <div className="mt-2">
            <input
              id="auction-video"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              disabled={!!videoPreview || isUploadingVideo}
              className="hidden"
            />
            <label
              htmlFor={videoPreview || isUploadingVideo ? undefined : 'auction-video'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                videoPreview || isUploadingVideo
                  ? 'opacity-50 pointer-events-none'
                  : 'cursor-pointer hover:bg-accent bg-background border-input'
              }`}
            >
              <Icon name="Video" className="h-4 w-4" />
              {isUploadingVideo ? 'Загрузка...' : 'Выбрать видео'}
            </label>
          </div>

          {videoPreview && (
            <div className="relative aspect-video rounded-lg overflow-hidden border mt-3 max-w-md">
              <video src={videoPreview} controls className="w-full h-full" />
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
