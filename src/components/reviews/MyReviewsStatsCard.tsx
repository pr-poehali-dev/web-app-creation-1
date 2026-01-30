import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface MyReviewsStatsCardProps {
  stats: {
    total_reviews: number;
    average_rating: number;
  };
}

export default function MyReviewsStatsCard({ stats }: MyReviewsStatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-primary mb-2">
            {stats.average_rating.toFixed(1)}
          </div>
          <div className="flex justify-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={star}
                name="Star"
                className={`h-5 w-5 ${
                  star <= Math.round(stats.average_rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            На основе {stats.total_reviews} {stats.total_reviews === 1 ? 'отзыва' : 'отзывов'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
