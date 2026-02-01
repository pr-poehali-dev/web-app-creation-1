import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { offersAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Offer } from '@/types/offer';
import { useAuth } from '@/hooks/useAuth';

export default function PublishOffer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, logout } = useAuth();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const loadOffer = async () => {
      if (!id) return;
      
      try {
        const data = await offersAPI.getOfferById(id);
        
        if (data.status !== 'draft') {
          toast({
            title: 'Ошибка',
            description: 'Это предложение уже опубликовано',
            variant: 'destructive',
          });
          navigate(`/offer/${id}`);
          return;
        }
        
        setOffer(data);
      } catch (error) {
        console.error('Error loading offer:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить предложение',
          variant: 'destructive',
        });
        navigate('/my-offers');
      } finally {
        setIsLoading(false);
      }
    };

    loadOffer();
  }, [id, navigate, toast]);

  const handlePublish = async () => {
    if (!id || !offer) return;
    
    setIsPublishing(true);
    try {
      await offersAPI.publishOffer(id);
      
      toast({
        title: 'Успешно!',
        description: 'Предложение опубликовано',
      });
      
      navigate('/predlozheniya');
    } catch (error: any) {
      console.error('Error publishing offer:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось опубликовать предложение',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={logout} />
        <main className="container mx-auto px-4 py-6 flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={logout} />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        <BackButton />
        
        <div className="max-w-2xl mx-auto mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon name="Send" className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Публикация предложения</CardTitle>
                  <CardDescription className="mt-1">
                    Подтвердите публикацию вашего предложения
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg">{offer.title}</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Категория</p>
                    <p className="font-medium">{offer.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Количество</p>
                    <p className="font-medium">{offer.quantity} {offer.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Цена за единицу</p>
                    <p className="font-medium">{offer.pricePerUnit} ₽</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Район</p>
                    <p className="font-medium">{offer.district}</p>
                  </div>
                </div>
                
                {offer.description && (
                  <div>
                    <p className="text-muted-foreground text-sm">Описание</p>
                    <p className="text-sm mt-1">{offer.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                <div className="flex gap-3">
                  <Icon name="Info" className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    <p className="font-medium mb-1">Что произойдёт после публикации:</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>Предложение станет видно всем пользователям</li>
                      <li>Покупатели смогут оформлять заказы</li>
                      <li>Вы будете получать уведомления о новых заказах</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => navigate(`/offer/${id}`)}
                  disabled={isPublishing}
                >
                  Отмена
                </Button>
                <Button
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handlePublish}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Публикация...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" className="h-5 w-5" />
                      Опубликовать
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
