import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Review } from '@/types/review';

interface ReviewCardProps {
  review: Review;
  onReplyClick?: () => void;
  showOfferTitle?: boolean;
}

export default function ReviewCard({ review, onReplyClick, showOfferTitle }: ReviewCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getUserTypeLabel = (type?: string) => {
    if (!type) return '';
    const labels: Record<string, string> = {
      individual: 'Физ. лицо',
      'self-employed': 'Самозанятый',
      entrepreneur: 'ИП',
      'legal-entity': 'Юр. лицо',
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="User" className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-foreground">
                  {review.reviewerName || 'Аноним'}
                </p>
                {review.reviewerType && (
                  <Badge variant="secondary" className="text-xs">
                    {getUserTypeLabel(review.reviewerType)}
                  </Badge>
                )}
                {review.isVerifiedPurchase && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Icon name="CheckCircle2" className="h-3 w-3" />
                    Проверенная покупка
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {renderStars(review.rating)}
                <span className="text-sm text-muted-foreground">
                  {formatDate(review.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {showOfferTitle && review.offerTitle && (
          <p className="text-sm text-muted-foreground mb-3">
            Заказ: <span className="font-medium">{review.offerTitle}</span>
          </p>
        )}

        <h4 className="font-semibold text-foreground mb-2">{review.title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {review.comment}
        </p>

        {(review.qualityRating || review.deliveryRating || review.communicationRating) && (
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            {review.qualityRating && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Качество:</span>
                {renderStars(review.qualityRating)}
              </div>
            )}
            {review.deliveryRating && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Доставка:</span>
                {renderStars(review.deliveryRating)}
              </div>
            )}
            {review.communicationRating && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Общение:</span>
                {renderStars(review.communicationRating)}
              </div>
            )}
          </div>
        )}

        {review.response && (
          <div className="mt-4 pt-4 border-t bg-muted/30 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Icon name="Store" className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-1">
                  {review.response.userName} • Ответ продавца
                </p>
                <p className="text-sm text-muted-foreground mb-2">
                  {review.response.text}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(review.response.createdAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {!review.response && onReplyClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReplyClick}
            className="mt-2 gap-2"
          >
            <Icon name="MessageSquare" className="h-4 w-4" />
            Ответить на отзыв
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
