import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface AuctionMediaSectionProps {
  imagePreviews: string[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

export default function AuctionMediaSection({ 
  imagePreviews, 
  onImageUpload, 
  onRemoveImage 
}: AuctionMediaSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Фотографии *</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="images">Загрузите фото (до 10 шт)</Label>
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={onImageUpload}
            className="mt-2"
          />
        </div>

        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative aspect-square group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon name="X" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
