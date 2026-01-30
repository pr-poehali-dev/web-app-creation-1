import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
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
            {stats && stats.total_reviews > 0 && (
              <div className="lg:col-span-1">
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
              </div>
            )}

            <div className={stats && stats.total_reviews > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
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
                      <Card key={review.id}>
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
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Напишите ваш ответ на отзыв..."
                                rows={3}
                                maxLength={500}
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitResponse(review.id as string)}
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
                                  onClick={() => {
                                    setRespondingTo(null);
                                    setResponseText('');
                                  }}
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
                                onClick={() => setRespondingTo(review.id as string)}
                              >
                                <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
                                Ответить на отзыв
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="positive" className="space-y-4">
                    {reviews
                      .filter((r) => r.rating >= 4)
                      .map((review) => (
                        <Card key={review.id}>
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
                                  onChange={(e) => setResponseText(e.target.value)}
                                  placeholder="Напишите ваш ответ на отзыв..."
                                  rows={3}
                                  maxLength={500}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitResponse(review.id as string)}
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
                                    onClick={() => {
                                      setRespondingTo(null);
                                      setResponseText('');
                                    }}
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
                                  onClick={() => setRespondingTo(review.id as string)}
                                >
                                  <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
                                  Ответить на отзыв
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
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
                        <Card key={review.id}>
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
                                  onChange={(e) => setResponseText(e.target.value)}
                                  placeholder="Напишите ваш ответ на отзыв..."
                                  rows={3}
                                  maxLength={500}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSubmitResponse(review.id as string)}
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
                                    onClick={() => {
                                      setRespondingTo(null);
                                      setResponseText('');
                                    }}
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
                                  onClick={() => setRespondingTo(review.id as string)}
                                >
                                  <Icon name="MessageCircle" className="h-4 w-4 mr-2" />
                                  Ответить на отзыв
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
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