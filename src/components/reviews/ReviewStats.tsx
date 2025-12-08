import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import type { ReviewStats as ReviewStatsType } from '@/types/review';

interface ReviewStatsProps {
  stats: ReviewStatsType;
}

export default function ReviewStats({ stats }: ReviewStatsProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Icon
            key={star}
            name="Star"
            className={`h-5 w-5 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getPercentage = (count: number) => {
    if (stats.totalReviews === 0) return 0;
    return Math.round((count / stats.totalReviews) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Рейтинг и отзывы</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center pb-6 border-b">
          <div className="text-5xl font-bold text-foreground mb-2">
            {stats.averageRating.toFixed(1)}
          </div>
          {renderStars(stats.averageRating)}
          <p className="text-sm text-muted-foreground mt-2">
            {stats.totalReviews}{' '}
            {stats.totalReviews === 1
              ? 'отзыв'
              : stats.totalReviews < 5
              ? 'отзыва'
              : 'отзывов'}
          </p>
        </div>

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
            const percentage = getPercentage(count);

            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-12">
                  <span className="text-sm font-medium">{rating}</span>
                  <Icon name="Star" className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <Progress value={percentage} className="h-2" />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>

        {(stats.qualityAverage || stats.deliveryAverage || stats.communicationAverage) && (
          <div className="pt-6 border-t space-y-3">
            <h4 className="text-sm font-semibold mb-3">Средние оценки</h4>

            {stats.qualityAverage && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Качество товара</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {stats.qualityAverage.toFixed(1)}
                  </span>
                  <Icon name="Star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            )}

            {stats.deliveryAverage && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Доставка</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {stats.deliveryAverage.toFixed(1)}
                  </span>
                  <Icon name="Star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            )}

            {stats.communicationAverage && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Общение с продавцом</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {stats.communicationAverage.toFixed(1)}
                  </span>
                  <Icon name="Star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
