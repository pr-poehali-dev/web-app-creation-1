import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Icon from '@/components/ui/icon';
import { useOffers } from '@/contexts/OffersContext';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';

export default function OrderPage({ isAuthenticated, onLogout }: { isAuthenticated: boolean; onLogout: () => void }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { offers } = useOffers();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState('1');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const offer = offers.find(o => o.id === id);

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

    if (!offer) {
      navigate('/predlozheniya');
    }
  }, [isAuthenticated, offer, navigate, toast]);

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

      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: 'Заказ оформлен!',
        description: 'Продавец свяжется с вами в ближайшее время',
      });

      navigate('/active-orders');
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

  const totalPrice = parseInt(quantity) * offer.pricePerUnit;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
          Назад
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Оформление заказа</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Количество ({offer.unit})</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={offer.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Доступно: {offer.quantity} {offer.unit}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label>Способ получения</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="comment">Комментарий (необязательно)</Label>
                    <Textarea
                      id="comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Дополнительная информация для продавца"
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Оформление...' : 'Подтвердить заказ'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Детали заказа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">{offer.title}</h3>
                  {offer.images.length > 0 && (
                    <img
                      src={offer.images[0].url}
                      alt={offer.images[0].alt}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                </div>

                <div className="space-y-2 text-sm">
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
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Итого:</span>
                    <span className="font-bold text-primary text-lg">
                      {totalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Продавец:</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
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
