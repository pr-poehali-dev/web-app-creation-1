import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  offerTitle: string;
  sellerName: string;
}

export default function OrderReviewModal({
  isOpen,
  onClose,
  onSubmit,
  offerTitle,
  sellerName,
}: OrderReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(rating, comment);
      setRating(0);
      setComment('');
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Icon
              name="Star"
              className={`h-8 w-8 ${
                star <= (hoveredRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Оставить отзыв о продавце (необязательно)</DialogTitle>
          <DialogDescription>
            Заказ: <span className="font-semibold">{offerTitle}</span>
            <br />
            Продавец: <span className="font-semibold">{sellerName}</span>
            <br />
            <span className="text-muted-foreground mt-2 block">Вы можете пропустить этот шаг или оставить отзыв</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Оценка продавца
            </Label>
            {renderStars()}
          </div>

          <div>
            <Label htmlFor="review-comment" className="text-base font-medium">
              Ваш отзыв
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Расскажите о вашем опыте работы с продавцом..."
              rows={5}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length} / 1000 символов
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Пропустить
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                'Опубликовать отзыв'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}