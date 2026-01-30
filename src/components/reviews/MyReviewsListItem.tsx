import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import type { Review } from '@/types/review';

interface MyReviewsListItemProps {
  review: Review;
  respondingTo: string | null;
  responseText: string;
  isSubmitting: boolean;
  onStartResponse: (reviewId: string) => void;
  onCancelResponse: () => void;
  onResponseTextChange: (text: string) => void;
  onSubmitResponse: (reviewId: string) => void;
}

export default function MyReviewsListItem({
  review,
  respondingTo,
  responseText,
  isSubmitting,
  onStartResponse,
  onCancelResponse,
  onResponseTextChange,
  onSubmitResponse,
}: MyReviewsListItemProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="Star"
                    className={`h-4 w-4 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {review.reviewerName}
              </span>
              <span className="text-sm text-muted-foreground">
                · {new Date(review.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <p className="text-foreground">{review.comment}</p>
          </div>
        </div>

        {review.sellerResponse ? (
          <div className="mt-4 ml-4 pl-4 border-l-2 border-primary/20 bg-primary/5 rounded-r-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="MessageCircle" className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold text-primary">Ваш ответ</p>
              <span className="text-xs text-muted-foreground">
                · {new Date(review.sellerResponseDate!).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <p className="text-sm">{review.sellerResponse}</p>
          </div>
        ) : respondingTo === review.id ? (
          <div className="mt-4 space-y-3">
            <Textarea
              value={responseText}
              onChange={(e) => onResponseTextChange(e.target.value)}
              placeholder="Напишите ваш ответ на отзыв..."
              rows={3}
              maxLength={500}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onSubmitResponse(review.id as string)}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Icon name="Loader2" className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Опубликовать ответ'
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelResponse}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStartResponse(review.id as string)}
            >
              <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
              Ответить на отзыв
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
