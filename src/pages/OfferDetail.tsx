import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { MOCK_OFFERS } from '@/data/mockOffers';
import type { Offer } from '@/types/offer';

interface OfferDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function OfferDetail({ isAuthenticated, onLogout }: OfferDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const foundOffer = MOCK_OFFERS.find(o => o.id === id);
      setOffer(foundOffer || null);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [id]);

  const handlePrevImage = () => {
    if (!offer) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? offer.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!offer) return;
    setCurrentImageIndex((prev) => 
      prev === offer.images.length - 1 ? 0 : prev + 1
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="mb-6">
            <div className="h-8 w-32 bg-muted animate-pulse rounded mb-4" />
            <div className="h-10 w-96 bg-muted animate-pulse rounded" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
            <div className="space-y-4">
              <div className="h-6 w-full bg-muted animate-pulse rounded" />
              <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
              <div className="h-32 w-full bg-muted animate-pulse rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-20">
            <Icon name="AlertCircle" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Предложение не найдено</h2>
            <p className="text-muted-foreground mb-8">
              Предложение с таким ID не существует или было удалено
            </p>
            <Button onClick={() => navigate('/offers')} className="gap-2">
              <Icon name="ArrowLeft" className="h-4 w-4" />
              Вернуться к предложениям
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const totalPrice = offer.pricePerUnit * offer.quantity;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <Icon name="ArrowLeft" className="h-4 w-4" />
          Назад
        </Button>

        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          <div>
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {offer.images.length > 0 ? (
                  <>
                    <img
                      src={offer.images[currentImageIndex].url}
                      alt={offer.images[currentImageIndex].alt}
                      className="w-full h-full object-cover"
                    />
                    {offer.images.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
                        >
                          <Icon name="ChevronLeft" className="h-6 w-6" />
                        </button>
                        <button
                          onClick={handleNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background shadow-lg transition-all"
                        >
                          <Icon name="ChevronRight" className="h-6 w-6" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {offer.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === currentImageIndex
                                  ? 'bg-white w-6'
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="Image" className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
                {offer.isPremium && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary text-primary-foreground gap-1">
                      <Icon name="Star" className="h-3 w-3" />
                      Премиум
                    </Badge>
                  </div>
                )}
              </div>
            </Card>

            {offer.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {offer.images.slice(0, 4).map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-primary'
                        : 'border-transparent hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{offer.title}</h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{offer.category}</Badge>
                    <Badge variant="outline">{offer.subcategory}</Badge>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">{offer.description}</p>
            </div>

            <Separator />

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Цена за единицу:</span>
                    <span className="text-2xl font-bold text-primary">
                      {offer.pricePerUnit.toLocaleString('ru-RU')} ₽/{offer.unit}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Количество:</span>
                    <span className="font-semibold">
                      {offer.quantity.toLocaleString('ru-RU')} {offer.unit}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Общая стоимость:</span>
                    <span className="text-2xl font-bold">
                      {totalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Icon name="MapPin" className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Местоположение</p>
                      <p className="font-medium">{offer.location}</p>
                      <p className="text-sm text-muted-foreground mt-1">Район: {offer.district}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <Icon name="Building2" className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Продавец</p>
                      <p className="font-medium">{offer.seller.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{offer.seller.type}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-start gap-3">
                    <Icon name="Calendar" className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Опубликовано</p>
                      <p className="font-medium">
                        {offer.createdAt.toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {offer.availableDistricts.length > 0 && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-3">
                        <Icon name="MapPinned" className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Доступно в районах</p>
                          <div className="flex flex-wrap gap-2">
                            {offer.availableDistricts.map((district, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {district}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button size="lg" className="flex-1 gap-2">
                <Icon name="ShoppingCart" className="h-5 w-5" />
                Заказать
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Icon name="MessageSquare" className="h-5 w-5" />
                Написать
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">Похожие предложения</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {MOCK_OFFERS.filter(o => 
                o.id !== offer.id && 
                (o.category === offer.category || o.subcategory === offer.subcategory)
              )
              .slice(0, 4)
              .map(relatedOffer => (
                <Card 
                  key={relatedOffer.id} 
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => navigate(`/offer/${relatedOffer.id}`)}
                >
                  <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                    {relatedOffer.images[0] ? (
                      <img
                        src={relatedOffer.images[0].url}
                        alt={relatedOffer.images[0].alt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon name="Image" className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{relatedOffer.title}</h3>
                    <p className="text-sm text-primary font-bold">
                      {relatedOffer.pricePerUnit.toLocaleString('ru-RU')} ₽/{relatedOffer.unit}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
