import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

interface AuctionReviewsProps {
  reviews: Review[];
  averageRating?: number;
}

export default function AuctionReviews({ reviews, averageRating }: AuctionReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            className={`h-4 w-4 ${
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
      <CardHeader className="py-2 md:py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm md:text-base">
            Отзывы ({reviews.length})
          </CardTitle>
          {averageRating && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="Star"
                    className={`h-4 w-4 ${
                      star <= Math.round(averageRating)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold">{averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="py-2 md:py-3 space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {review.reviewerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{review.reviewerName}</p>
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
    </Card>
  );
}
