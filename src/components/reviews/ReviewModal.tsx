import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import SwipeableModal from '@/components/ui/SwipeableModal';
import type { CreateReviewData } from '@/types/review';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReviewData) => Promise<void>;
  contractId: string;
  reviewedUserId: string;
  offerTitle: string;
  sellerName: string;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  contractId,
  reviewedUserId,
  offerTitle,
  sellerName,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [qualityRating, setQualityRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (rating === 0) {
      newErrors.rating = 'Поставьте оценку';
    }

    if (!title.trim()) {
      newErrors.title = 'Введите заголовок';
    }

    if (!comment.trim()) {
      newErrors.comment = 'Напишите комментарий';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        contractId,
        reviewedUserId,
        rating,
        title,
        comment,
        qualityRating: qualityRating || undefined,
        deliveryRating: deliveryRating || undefined,
        communicationRating: communicationRating || undefined,
      });

      setRating(0);
      setTitle('');
      setComment('');
      setQualityRating(0);
      setDeliveryRating(0);
      setCommunicationRating(0);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    value: number,
    hovered: number,
    onChange: (val: number) => void,
    onHover: (val: number) => void
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={() => onHover(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Icon
              name="Star"
              className={`h-8 w-8 ${
                star <= (hovered || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const renderSmallStars = (value: number, onChange: (val: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Icon
              name="Star"
              className={`h-5 w-5 ${
                star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <SwipeableModal
      isOpen={isOpen}
      onClose={onClose}
      title="Оставить отзыв"
    >
      <div className="px-4 sm:px-6 py-4">
        <p className="text-sm text-muted-foreground mb-4">
          Отзыв о заказе: <span className="font-semibold">{offerTitle}</span>
          <br />
          Продавец: <span className="font-semibold">{sellerName}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Общая оценка <span className="text-red-500">*</span>
            </Label>
            {renderStars(rating, hoveredRating, setRating, setHoveredRating)}
            {errors.rating && (
              <p className="text-sm text-red-500 mt-1">{errors.rating}</p>
            )}
          </div>

          <div>
            <Label htmlFor="review-title" className="text-base font-medium">
              Заголовок отзыва <span className="text-red-500">*</span>
            </Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              placeholder="Например: Отличный товар, рекомендую!"
              maxLength={100}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="review-comment" className="text-base font-medium">
              Ваш отзыв <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                if (errors.comment) setErrors({ ...errors, comment: '' });
              }}
              placeholder="Расскажите подробнее о вашем опыте..."
              rows={5}
              maxLength={1000}
              className={errors.comment ? 'border-red-500' : ''}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {comment.length} / 1000 символов
            </p>
            {errors.comment && (
              <p className="text-sm text-red-500 mt-1">{errors.comment}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-4">
              Дополнительные оценки (необязательно)
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Качество товара</Label>
                {renderSmallStars(qualityRating, setQualityRating)}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Доставка</Label>
                {renderSmallStars(deliveryRating, setDeliveryRating)}
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Общение с продавцом</Label>
                {renderSmallStars(communicationRating, setCommunicationRating)}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Отмена
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
      </div>
    </SwipeableModal>
  );
}