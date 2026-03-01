import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface RequestMediaSectionProps {
  images: File[];
  imagePreviews: string[];
  video: File | null;
  videoPreview: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: () => void;
}

export default function RequestMediaSection({
  images,
  imagePreviews,
  video,
  videoPreview,
  onImageUpload,
  onRemoveImage,
  onVideoUpload,
  onRemoveVideo,
}: RequestMediaSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Медиа</CardTitle>
        <CardDescription>
          Загрузите фото и/или видео к вашему запросу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="images">Фото (до 10 файлов)</Label>
          <div className="mt-2">
            <Input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={onImageUpload}
              disabled={images.length >= 10}
            />
            <p className="text-xs text-muted-foreground mt-1">{images.length}/10 фото</p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
              {imagePreviews.map((src, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                  <img src={src} alt={`Фото ${index + 1}`} className="w-full h-full object-cover" />
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
          <Label htmlFor="video">Видео (1 файл)</Label>
          <div className="mt-2">
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={onVideoUpload}
              disabled={!!video}
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
