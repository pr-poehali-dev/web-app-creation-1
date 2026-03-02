import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { reviewsAPI } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SellerReviewsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  reviewed_user_id: string;
  rating: number;
  comment: string;
  seller_response?: string;
  seller_response_date?: string;
  created_at: string;
}

export default function SellerReviews({ isAuthenticated, onLogout }: SellerReviewsProps) {
  useScrollToTop();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ total_reviews: number; average_rating: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    reviewsAPI.getReviewsBySeller(Number(userId))
      .then((data) => {
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      })
      .catch(() => {
        setReviews([]);
        setStats(null);
      })
      .finally(() => setIsLoading(false));
  }, [userId]);

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Icon
          key={star}
          name="Star"
          className={`h-4 w-4 ${star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8 flex-1 max-w-3xl">
        <BackButton />
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Отзывы о пользователе</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {stats && stats.total_reviews > 0 && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-foreground">{stats.average_rating.toFixed(1)}</div>
                    <div>
                      <div className="flex gap-1 mb-1">
                        {renderStars(Math.round(stats.average_rating))}
                      </div>
                      <p className="text-sm text-muted-foreground">{stats.total_reviews} отзывов</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {reviews.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <Icon name="MessageSquare" className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Пока нет отзывов</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4" id="reviews">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">П</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <p className="font-semibold text-sm">Покупатель</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ru })}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <Badge variant={review.rating >= 4 ? 'default' : review.rating <= 2 ? 'destructive' : 'secondary'}>
                                {review.rating}/5
                              </Badge>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                          )}
                          {review.seller_response && (
                            <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/20 bg-primary/5 rounded-r-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Icon name="MessageCircle" className="h-4 w-4 text-primary" />
                                <p className="text-xs font-semibold text-primary">Ответ продавца</p>
                              </div>
                              <p className="text-sm text-muted-foreground">{review.seller_response}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
