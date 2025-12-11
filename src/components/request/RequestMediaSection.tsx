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
          Можете загрузить видеокомментарий к вашему запросу
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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