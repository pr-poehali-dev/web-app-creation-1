import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewStats from '@/components/reviews/ReviewStats';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import { reviewsAPI } from '@/services/reviews';
import type { Review, ReviewStats as ReviewStatsType } from '@/types/review';

interface MyReviewsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyReviews({ isAuthenticated, onLogout }: MyReviewsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const currentUser = getSession();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStatsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    loadReviews();
  }, [isAuthenticated, currentUser, navigate]);

  const loadReviews = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const [reviewsData, statsData] = await Promise.all([
        reviewsAPI.getReviewsByUser(currentUser.id),
        reviewsAPI.getReviewStats(currentUser.id),
      ]);

      setReviews(reviewsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Мои отзывы</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Отзывы клиентов о вашей работе
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {stats && stats.totalReviews > 0 && (
              <div className="lg:col-span-1">
                <ReviewStats stats={stats} />
              </div>
            )}

            <div className={stats && stats.totalReviews > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Icon
                      name="MessageSquare"
                      className="h-16 w-16 text-muted-foreground mx-auto mb-4"
                    />
                    <h3 className="text-xl font-semibold mb-2">Пока нет отзывов</h3>
                    <p className="text-muted-foreground">
                      Здесь появятся отзывы от ваших клиентов после завершения заказов
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="all" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="all">
                      Все отзывы ({reviews.length})
                    </TabsTrigger>
                    <TabsTrigger value="positive">
                      Положительные ({reviews.filter((r) => r.rating >= 4).length})
                    </TabsTrigger>
                    <TabsTrigger value="negative">
                      Отрицательные ({reviews.filter((r) => r.rating <= 2).length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-4">
                    {reviews.map((review) => (
                      <ReviewCard key={review.id} review={review} showOfferTitle />
                    ))}
                  </TabsContent>

                  <TabsContent value="positive" className="space-y-4">
                    {reviews
                      .filter((r) => r.rating >= 4)
                      .map((review) => (
                        <ReviewCard key={review.id} review={review} showOfferTitle />
                      ))}
                    {reviews.filter((r) => r.rating >= 4).length === 0 && (
                      <Card>
                        <CardContent className="pt-6 text-center py-12">
                          <p className="text-muted-foreground">
                            Нет положительных отзывов
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="negative" className="space-y-4">
                    {reviews
                      .filter((r) => r.rating <= 2)
                      .map((review) => (
                        <ReviewCard key={review.id} review={review} showOfferTitle />
                      ))}
                    {reviews.filter((r) => r.rating <= 2).length === 0 && (
                      <Card>
                        <CardContent className="pt-6 text-center py-12">
                          <p className="text-muted-foreground">
                            Нет отрицательных отзывов
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}