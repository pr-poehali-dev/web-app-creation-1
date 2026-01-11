import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  offerTitle?: string;
}

interface ProfileReviewsCardProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export default function ProfileReviewsCard({ reviews, averageRating, totalReviews }: ProfileReviewsCardProps) {
  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            className={`${sizeClass} ${
              star <= rating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Отзывы</h3>
            {totalReviews > 0 && (
              <div className="flex items-center gap-2">
                {renderStars(Math.round(averageRating), 'md')}
                <span className="text-lg font-bold">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({totalReviews})</span>
              </div>
            )}
          </div>
          {totalReviews === 0 && (
            <p className="text-sm text-muted-foreground">Пока нет отзывов</p>
          )}
        </div>
      </CardHeader>
      {reviews.length > 0 && (
        <CardContent className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {review.reviewerName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{review.reviewerName}</p>
                      {review.offerTitle && (
                        <p className="text-xs text-muted-foreground">{review.offerTitle}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(review.createdAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </p>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
