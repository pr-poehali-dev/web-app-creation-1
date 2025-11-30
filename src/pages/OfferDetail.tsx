import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OfferCard from '@/components/OfferCard';
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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: offer?.title,
          text: offer?.description,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Ссылка скопирована в буфер обмена');
    }
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
            <h2 className="text-2xl font-bold mb-3">Контент не найден</h2>
            <p className="text-muted-foreground mb-8">
              Предложение с таким ID не существует или было удалено
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/')} className="gap-2">
                <Icon name="Home" className="h-4 w-4" />
                На главную
              </Button>
              <Button onClick={() => navigate('/predlozheniya')} variant="outline" className="gap-2">
                <Icon name="Package" className="h-4 w-4" />
                К предложениям
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const remainingQuantity = offer.quantity - (offer.orderedQuantity || 0);
  const totalPrice = offer.pricePerUnit * offer.quantity;
  const similarOffers = MOCK_OFFERS
    .filter(o => o.id !== offer.id && o.category === offer.category)
    .slice(0, 4);

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

        <div className="grid gap-8 lg:grid-cols-3 mb-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden mb-6">
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
                    {offer.isPremium && (
                      <Badge className="absolute top-4 right-4 gap-1 bg-primary">
                        <Icon name="Star" className="h-3 w-3" />
                        Премиум
                      </Badge>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="Package" className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Card>

            {offer.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mb-6">
                {offer.images.slice(0, 4).map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-primary scale-95'
                        : 'border-transparent hover:border-muted-foreground/30'
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

            <Card>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-4">{offer.title}</h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="gap-1">
                      <Icon name="Tag" className="h-3 w-3" />
                      {offer.category}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {offer.subcategory}
                    </Badge>
                    {offer.hasVAT && (
                      <Badge variant="outline" className="gap-1">
                        <Icon name="Receipt" className="h-3 w-3" />
                        НДС {offer.vatRate}%
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Описание</h3>
                  <p className="text-muted-foreground leading-relaxed">{offer.description}</p>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon name="Package" className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Количество</p>
                      <p className="font-semibold">{offer.quantity} {offer.unit}</p>
                      {offer.orderedQuantity && offer.orderedQuantity > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Остаток: {remainingQuantity} {offer.unit}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon name="DollarSign" className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Цена за единицу</p>
                      <p className="font-semibold text-xl">{offer.pricePerUnit.toLocaleString()} ₽</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon name="MapPin" className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Местоположение</p>
                      <p className="font-semibold">{offer.location}</p>
                      {offer.fullAddress && (
                        <p className="text-sm text-muted-foreground">{offer.fullAddress}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon name="Calendar" className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Дата публикации</p>
                      <p className="font-semibold">
                        {offer.createdAt.toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                </div>

                {offer.expiryDate && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-destructive/10">
                        <Icon name="Clock" className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Срок годности</p>
                        <p className="font-semibold text-destructive">
                          До {offer.expiryDate.toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Доступные районы</h3>
                  <div className="flex flex-wrap gap-2">
                    {offer.availableDistricts.map((district) => (
                      <Badge key={district} variant="secondary" className="gap-1">
                        <Icon name="MapPin" className="h-3 w-3" />
                        {district}
                      </Badge>
                    ))}
                  </div>
                </div>

                {offer.availableDeliveryTypes && offer.availableDeliveryTypes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3">Типы получения</h3>
                      <div className="flex flex-wrap gap-2">
                        {offer.availableDeliveryTypes.includes('pickup') && (
                          <Badge variant="outline" className="gap-1">
                            <Icon name="Store" className="h-3 w-3" />
                            Самовывоз
                          </Badge>
                        )}
                        {offer.availableDeliveryTypes.includes('delivery') && (
                          <Badge variant="outline" className="gap-1">
                            <Icon name="Truck" className="h-3 w-3" />
                            Доставка
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Общая стоимость</p>
                  <p className="text-3xl font-bold text-primary">
                    {totalPrice.toLocaleString()} ₽
                  </p>
                </div>

                <div className="space-y-3">
                  <Button className="w-full gap-2" size="lg">
                    <Icon name="ShoppingCart" className="h-5 w-5" />
                    Заказать
                  </Button>
                  <Button variant="outline" className="w-full gap-2" size="lg">
                    <Icon name="MessageCircle" className="h-5 w-5" />
                    Написать
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full gap-2"
                    onClick={handleShare}
                  >
                    <Icon name="Share2" className="h-4 w-4" />
                    Поделиться
                  </Button>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Продавец</h3>
                    {offer.seller.isVerified && (
                      <Badge className="gap-1 bg-green-500">
                        <Icon name="BadgeCheck" className="h-3 w-3" />
                        Верифицирован
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold text-lg">{offer.seller.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Icon name="Star" className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{offer.seller.rating}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({offer.seller.reviewsCount} отзывов)
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {offer.seller.responsiblePerson && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Ответственный сотрудник</p>
                        <p className="font-medium">{offer.seller.responsiblePerson.name}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Контакты</p>
                      <div className="space-y-1">
                        <a
                          href={`tel:${offer.seller.phone}`}
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <Icon name="Phone" className="h-4 w-4" />
                          {offer.seller.phone}
                        </a>
                        <a
                          href={`mailto:${offer.seller.email}`}
                          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                        >
                          <Icon name="Mail" className="h-4 w-4" />
                          {offer.seller.email}
                        </a>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Статистика</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Активных предложений</p>
                          <p className="font-semibold">{offer.seller.statistics.activeOffers}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Завершённых заказов</p>
                          <p className="font-semibold">{offer.seller.statistics.completedOrders}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">На площадке с</p>
                          <p className="font-semibold">
                            {offer.seller.statistics.registrationDate.toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => navigate(`/seller/${offer.seller.id}`)}
                    >
                      <Icon name="Building2" className="h-4 w-4" />
                      Перейти на страницу организации
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {similarOffers.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Похожие предложения</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {similarOffers.map((similarOffer) => (
                <OfferCard key={similarOffer.id} offer={similarOffer} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
