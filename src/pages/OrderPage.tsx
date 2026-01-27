import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import { offersAPI, ordersAPI } from '@/services/api';
import { notifyNewOrder } from '@/utils/notifications';
import { sendPushNotification } from '@/utils/pushNotifications';
import { markDataAsUpdated } from '@/utils/smartCache';
import type { Offer } from '@/types/offer';

export default function OrderPage({ isAuthenticated, onLogout }: { isAuthenticated: boolean; onLogout: () => void }) {
  useScrollToTop();
  const { offerId } = useParams<{ offerId: string }>();
  const id = offerId;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState('1');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Требуется авторизация',
        description: 'Войдите в систему для оформления заказа',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    const loadOffer = async () => {
      if (!id) {
        navigate('/predlozheniya');
        return;
      }

      try {
        setIsLoading(true);
        const data = await offersAPI.getOfferById(id);
        
        const mappedOffer: Offer = {
          ...data,
          pricePerUnit: data.price_per_unit || data.pricePerUnit || 0,
          minOrderQuantity: data.min_order_quantity || data.minOrderQuantity,
          vatRate: data.vat_rate || data.vatRate,
          hasVAT: data.has_vat !== undefined ? data.has_vat : data.hasVAT,
          isPremium: data.is_premium !== undefined ? data.is_premium : data.isPremium,
          availableDistricts: data.available_districts || data.availableDistricts || [],
          availableDeliveryTypes: data.available_delivery_types || data.availableDeliveryTypes || ['pickup'],
          userId: data.user_id || data.userId,
          fullAddress: data.full_address || data.fullAddress,
          seller: data.seller_name ? {
            id: data.user_id || data.userId,
            name: data.seller_name,
            type: data.seller_type,
            phone: data.seller_phone,
            email: data.seller_email,
            rating: data.seller_rating || 0,
            reviewsCount: data.seller_reviews_count || 0,
            isVerified: data.seller_is_verified || false,
            statistics: {
              totalOffers: 0,
              activeOffers: 0,
              completedOrders: 0,
              registrationDate: new Date(),
            }
          } : undefined,
          createdAt: new Date(data.createdAt || data.created_at),
          updatedAt: data.updatedAt || data.updated_at ? new Date(data.updatedAt || data.updated_at) : undefined,
        };
        
        setOffer(mappedOffer);
      } catch (error) {
        console.error('Error loading offer:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить предложение',
          variant: 'destructive',
        });
        navigate('/predlozheniya');
      } finally {
        setIsLoading(false);
      }
    };

    loadOffer();
  }, [id, isAuthenticated, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const session = getSession();
      const orderQuantity = parseInt(quantity);

      if (isNaN(orderQuantity) || orderQuantity <= 0) {
        toast({
          title: 'Ошибка',
          description: 'Укажите корректное количество',
          variant: 'destructive',
        });
        return;
      }

      if (offer.minOrderQuantity && orderQuantity < offer.minOrderQuantity) {
        toast({
          title: 'Ошибка',
          description: `Минимальное количество заказа: ${offer.minOrderQuantity} ${offer.unit}`,
          variant: 'destructive',
        });
        return;
      }

      if (orderQuantity > offer.quantity) {
        toast({
          title: 'Ошибка',
          description: `Доступно только ${offer.quantity} ${offer.unit}`,
          variant: 'destructive',
        });
        return;
      }

      if (deliveryType === 'delivery' && !address.trim()) {
        toast({
          title: 'Ошибка',
          description: 'Укажите адрес доставки',
          variant: 'destructive',
        });
        return;
      }

      if (!session) {
        toast({
          title: 'Ошибка',
          description: 'Необходима авторизация',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      const orderData = {
        offerId: offer.id,
        title: offer.title,
        quantity: orderQuantity,
        unit: offer.unit,
        pricePerUnit: offer.pricePerUnit,
        hasVAT: offer.hasVAT,
        vatRate: offer.vatRate,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? address : '',
        district: offer.district,
        buyerName: `${session.firstName} ${session.lastName}`,
        buyerPhone: session.phone || '',
        buyerEmail: session.email || '',
        buyerComment: comment,
      };

      const result = await ordersAPI.createOrder(orderData);

      notifyNewOrder(
        offer.userId.toString(),
        offer.title,
        `${session.firstName} ${session.lastName}`,
        orderQuantity,
        offer.unit,
        result.id
      );

      // Отправляем событие о новом заказе для онлайн-уведомлений
      window.dispatchEvent(new CustomEvent('newOrderCreated', {
        detail: {
          orderId: result.id,
          sellerId: offer.userId.toString(),
          buyerName: `${session.firstName} ${session.lastName}`,
          quantity: orderQuantity,
          unit: offer.unit,
          offerTitle: offer.title
        }
      }));

      // Отправляем push-уведомление продавцу (работает даже если продавец оффлайн)
      sendPushNotification(
        offer.userId.toString(),
        {
          title: '🛒 Новый заказ!',
          body: `${session.firstName} ${session.lastName} заказал ${orderQuantity} ${offer.unit} - "${offer.title}"`,
          icon: '/favicon.ico',
          url: '/my-orders?tab=seller',
          tag: `order-${result.id}`,
          requireInteraction: true,
        }
      ).catch((err) => console.log('[Push] Ошибка отправки push:', err));

      // Помечаем что заказы обновились
      markDataAsUpdated('orders');
      
      toast({
        title: 'Заказ оформлен!',
        description: 'Продавец свяжется с вами в ближайшее время',
      });

      navigate('/my-orders');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось оформить заказ. Попробуйте позже',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = parseInt(quantity) * offer.pricePerUnit;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-4">
        <BackButton />

        <div className="grid lg:grid-cols-3 gap-4 mt-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Оформление заказа</CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="quantity" className="text-sm">Количество ({offer.unit})</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min={offer.minOrderQuantity || 1}
                      max={offer.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className="h-9"
                    />
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Доступно: {offer.quantity} {offer.unit}</p>
                      {offer.minOrderQuantity && (
                        <p>Минимальный заказ: {offer.minOrderQuantity} {offer.unit}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Способ получения</Label>
                    <RadioGroup value={deliveryType} onValueChange={(value) => setDeliveryType(value as 'pickup' | 'delivery')}>
                      {offer.availableDeliveryTypes.includes('pickup') && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pickup" id="pickup" />
                          <Label htmlFor="pickup" className="font-normal cursor-pointer">
                            Самовывоз
                          </Label>
                        </div>
                      )}
                      {offer.availableDeliveryTypes.includes('delivery') && (
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="delivery" id="delivery" />
                          <Label htmlFor="delivery" className="font-normal cursor-pointer">
                            Доставка
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>

                  {deliveryType === 'pickup' && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Адрес самовывоза:</p>
                      <p className="text-sm text-muted-foreground">{offer.fullAddress}</p>
                    </div>
                  )}

                  {deliveryType === 'delivery' && (
                    <div className="space-y-2">
                      <Label htmlFor="address">Адрес доставки</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Укажите полный адрес"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="comment" className="text-sm">Комментарий (необязательно)</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Дополнительная информация для продавца"
                      rows={3}
                      className="text-sm"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Оформление...' : 'Подтвердить заказ'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Детали заказа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div>
                  <h3 className="font-semibold text-sm mb-2">{offer.title}</h3>
                  {offer.images.length > 0 && (
                    <img
                      src={offer.images[0].url}
                      alt={offer.images[0].alt}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                  )}
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Цена за {offer.unit}:</span>
                    <span className="font-medium">{offer.pricePerUnit.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Количество:</span>
                    <span className="font-medium">{quantity} {offer.unit}</span>
                  </div>
                  {offer.hasVAT && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">НДС {offer.vatRate}%:</span>
                      <span className="font-medium">
                        {(totalPrice * (offer.vatRate || 0) / 100).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-1.5 flex justify-between">
                    <span className="font-semibold">Итого:</span>
                    <span className="font-bold text-primary text-lg">
                      {totalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-1.5">Продавец:</p>
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    <p>{offer.seller?.name}</p>
                    <p>{offer.seller?.phone}</p>
                    <p>{offer.seller?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}