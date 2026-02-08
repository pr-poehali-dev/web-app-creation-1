import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import MyReviewsLoadingSkeleton from '@/components/reviews/MyReviewsLoadingSkeleton';
import MyReviewsStatsCard from '@/components/reviews/MyReviewsStatsCard';
import MyReviewsEmptyState from '@/components/reviews/MyReviewsEmptyState';
import MyReviewsListItem from '@/components/reviews/MyReviewsListItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { getSession } from '@/utils/auth';
import { reviewsAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Review } from '@/types/review';

interface MyReviewsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function MyReviews({ isAuthenticated, onLogout }: MyReviewsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ total_reviews: number; average_rating: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadReviews = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const data = await reviewsAPI.getReviewsBySeller(Number(currentUser.id));
      
      const mappedReviews = data.reviews.map((r: any) => ({
        id: String(r.id),
        orderId: r.order_id,
        reviewerId: String(r.reviewer_id),
        reviewerName: 'Покупатель',
        reviewedUserId: String(r.reviewed_user_id),
        rating: r.rating,
        comment: r.comment || '',
        createdAt: r.created_at,
        sellerResponse: r.seller_response,
        sellerResponseDate: r.seller_response_date,
      }));

      setReviews(mappedReviews);
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Напишите ответ',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsAPI.addSellerResponse({
        review_id: Number(reviewId),
        seller_response: responseText,
      });

      toast({
        title: 'Ответ опубликован',
        description: 'Ваш ответ успешно добавлен',
      });

      setRespondingTo(null);
      setResponseText('');
      await loadReviews();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось опубликовать ответ',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartResponse = (reviewId: string) => {
    setRespondingTo(reviewId);
  };

  const handleCancelResponse = () => {
    setRespondingTo(null);
    setResponseText('');
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
          <MyReviewsLoadingSkeleton />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {stats && stats.total_reviews > 0 && (
              <div className="lg:col-span-1">
                <MyReviewsStatsCard stats={stats} />
              </div>
            )}

            <div className={stats && stats.total_reviews > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
              {reviews.length === 0 ? (
                <MyReviewsEmptyState />
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
                      <MyReviewsListItem
                        key={review.id}
                        review={review}
                        respondingTo={respondingTo}
                        responseText={responseText}
                        isSubmitting={isSubmitting}
                        onStartResponse={handleStartResponse}
                        onCancelResponse={handleCancelResponse}
                        onResponseTextChange={setResponseText}
                        onSubmitResponse={handleSubmitResponse}
                      />
                    ))}
                  </TabsContent>

                  <TabsContent value="positive" className="space-y-4">
                    {reviews
                      .filter((r) => r.rating >= 4)
                      .map((review) => (
                        <MyReviewsListItem
                          key={review.id}
                          review={review}
                          respondingTo={respondingTo}
                          responseText={responseText}
                          isSubmitting={isSubmitting}
                          onStartResponse={handleStartResponse}
                          onCancelResponse={handleCancelResponse}
                          onResponseTextChange={setResponseText}
                          onSubmitResponse={handleSubmitResponse}
                        />
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
                        <MyReviewsListItem
                          key={review.id}
                          review={review}
                          respondingTo={respondingTo}
                          responseText={responseText}
                          isSubmitting={isSubmitting}
                          onStartResponse={handleStartResponse}
                          onCancelResponse={handleCancelResponse}
                          onResponseTextChange={setResponseText}
                          onSubmitResponse={handleSubmitResponse}
                        />
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
