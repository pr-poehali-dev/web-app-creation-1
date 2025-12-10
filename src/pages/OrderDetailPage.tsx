import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import ChatBox from '@/components/chat/ChatBox';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import type { Order, ChatMessage } from '@/types/chat';

interface OrderDetailPageProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function OrderDetailPage({ isAuthenticated, onLogout }: OrderDetailPageProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getSession();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    const loadOrder = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockOrder: Order = {
          id: id,
          orderNumber: 'ORD-2024-001',
          offerId: '1',
          offerTitle: 'Цемент М500, 50 кг',
          offerImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
          buyerId: 'buyer1',
          buyerName: 'Иван Петров',
          buyerPhone: '+7 900 123-45-67',
          buyerEmail: 'ivan@example.com',
          sellerId: 'seller1',
          sellerName: 'ООО "Стройматериалы"',
          sellerPhone: '+7 900 999-88-77',
          sellerEmail: 'info@stroymat.ru',
          quantity: 100,
          unit: 'мешок',
          pricePerUnit: 450,
          totalPrice: 45000,
          hasVAT: true,
          vatRate: 20,
          deliveryType: 'delivery',
          deliveryAddress: 'ул. Ленина, д. 10',
          district: 'Центральный',
          comment: 'Доставить до обеда',
          status: 'confirmed',
          createdAt: new Date('2024-12-09'),
          updatedAt: new Date('2024-12-09'),
          chat: {
            orderId: id,
            messages: [
              {
                id: '1',
                orderId: id,
                senderId: 'seller1',
                senderName: 'ООО "Стройматериалы"',
                senderType: 'seller',
                text: 'Здравствуйте! Ваш заказ принят в обработку. Доставка будет завтра до 14:00.',
                timestamp: new Date('2024-12-09T10:30:00'),
                isRead: true
              },
              {
                id: '2',
                orderId: id,
                senderId: 'buyer1',
                senderName: 'Иван Петров',
                senderType: 'buyer',
                text: 'Отлично, спасибо! Буду ждать.',
                timestamp: new Date('2024-12-09T10:35:00'),
                isRead: true
              }
            ],
            participants: {
              buyer: { id: 'buyer1', name: 'Иван Петров' },
              seller: { id: 'seller1', name: 'ООО "Стройматериалы"' }
            },
            unreadCount: 0,
            lastMessageAt: new Date('2024-12-09T10:35:00')
          }
        };
        
        setOrder(mockOrder);
        setMessages(mockOrder.chat?.messages || []);
      } catch (error) {
        console.error('Error loading order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [id, isAuthenticated, currentUser, navigate]);

  const handleSendMessage = async (text: string, attachments?: File[]) => {
    if (!currentUser || !order) return;

    const isBuyer = currentUser.id === order.buyerId;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      orderId: order.id,
      senderId: currentUser.id,
      senderName: currentUser.firstName + ' ' + currentUser.lastName,
      senderType: isBuyer ? 'buyer' : 'seller',
      text: text,
      timestamp: new Date(),
      isRead: false,
      attachments: attachments?.map(file => ({
        id: Date.now().toString(),
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type
      }))
    };

    setMessages(prev => [...prev, newMessage]);
  };

  const getStatusBadge = (status: Order['status']) => {
    const statusConfig = {
      pending: { label: 'Ожидает', variant: 'secondary' as const },
      confirmed: { label: 'Подтверждён', variant: 'default' as const },
      in_progress: { label: 'В работе', variant: 'default' as const },
      completed: { label: 'Завершён', variant: 'outline' as const },
      cancelled: { label: 'Отменён', variant: 'destructive' as const }
    };
    
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[600px] w-full" />
            </div>
            <div>
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-20">
            <Icon name="AlertCircle" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Заказ не найден</h2>
            <p className="text-muted-foreground">
              Заказ с таким ID не существует или был удалён
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isBuyer = currentUser?.id === order.buyerId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-6 flex-1">
        <BackButton />

        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold">Заказ #{order.orderNumber}</h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <ChatBox
              orderId={order.id}
              messages={messages}
              currentUserId={currentUser?.id || ''}
              currentUserName={currentUser?.firstName + ' ' + currentUser?.lastName || ''}
              currentUserType={isBuyer ? 'buyer' : 'seller'}
              onSendMessage={handleSendMessage}
            />
          </div>

          <div className="space-y-3 order-1 lg:order-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Информация о заказе</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.offerImage && (
                  <img
                    src={order.offerImage}
                    alt={order.offerTitle}
                    className="w-full h-24 sm:h-28 object-cover rounded-lg"
                  />
                )}
                
                <div>
                  <h3 className="font-semibold text-sm mb-2">{order.offerTitle}</h3>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Количество:</span>
                      <span className="font-medium">{order.quantity} {order.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Цена за {order.unit}:</span>
                      <span className="font-medium">{order.pricePerUnit.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    {order.hasVAT && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">НДС {order.vatRate}%:</span>
                        <span className="font-medium">
                          {((order.totalPrice * (order.vatRate || 0)) / 100).toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold">Итого:</span>
                      <span className="font-bold text-primary text-base">
                        {order.totalPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-1.5 text-xs">Доставка</h4>
                  <div className="space-y-0.5 text-xs">
                    <p className="text-muted-foreground">
                      {order.deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз'}
                    </p>
                    {order.deliveryAddress && (
                      <p className="font-medium">{order.deliveryAddress}</p>
                    )}
                    <p className="text-muted-foreground">Район: {order.district}</p>
                  </div>
                </div>

                {order.comment && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-1.5 text-xs">Комментарий</h4>
                      <p className="text-xs text-muted-foreground">{order.comment}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon name="User" className="h-4 w-4" />
                  {isBuyer ? 'Продавец' : 'Покупатель'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-semibold text-sm">
                    {isBuyer ? order.sellerName : order.buyerName}
                  </p>
                  <div className="space-y-1 text-xs mt-1.5">
                    <a
                      href={`tel:${isBuyer ? order.sellerPhone : order.buyerPhone}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon name="Phone" className="h-4 w-4" />
                      {isBuyer ? order.sellerPhone : order.buyerPhone}
                    </a>
                    <a
                      href={`mailto:${isBuyer ? order.sellerEmail : order.buyerEmail}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon name="Mail" className="h-4 w-4" />
                      {isBuyer ? order.sellerEmail : order.buyerEmail}
                    </a>
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