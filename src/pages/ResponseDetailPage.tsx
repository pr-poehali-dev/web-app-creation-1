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
import type { Response, ChatMessage } from '@/types/chat';

interface ResponseDetailPageProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function ResponseDetailPage({ isAuthenticated, onLogout }: ResponseDetailPageProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getSession();
  
  const [response, setResponse] = useState<Response | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    const loadResponse = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockResponse: Response = {
          id: id,
          responseNumber: 'RSP-2024-001',
          requestId: '1',
          requestTitle: 'Нужен строительный песок',
          buyerId: 'buyer1',
          buyerName: 'ООО "СтройДом"',
          sellerId: 'seller1',
          sellerName: 'ИП Иванов',
          sellerPhone: '+7 900 888-77-66',
          sellerEmail: 'ivanov@example.com',
          quantity: 50,
          unit: 'т',
          pricePerUnit: 420,
          totalPrice: 21000,
          deliveryDays: 3,
          comment: 'Доставим качественный песок в срок',
          status: 'accepted',
          createdAt: new Date('2024-12-08'),
          updatedAt: new Date('2024-12-09'),
          chat: {
            orderId: id,
            messages: [
              {
                id: '1',
                orderId: id,
                senderId: 'seller1',
                senderName: 'ИП Иванов',
                senderType: 'seller',
                text: 'Здравствуйте! Готовы предоставить качественный песок. Есть все сертификаты.',
                timestamp: new Date('2024-12-08T14:00:00'),
                isRead: true
              },
              {
                id: '2',
                orderId: id,
                senderId: 'buyer1',
                senderName: 'ООО "СтройДом"',
                senderType: 'buyer',
                text: 'Отлично! Когда сможете доставить?',
                timestamp: new Date('2024-12-08T14:15:00'),
                isRead: true
              }
            ],
            participants: {
              buyer: { id: 'buyer1', name: 'ООО "СтройДом"' },
              seller: { id: 'seller1', name: 'ИП Иванов' }
            },
            unreadCount: 0,
            lastMessageAt: new Date('2024-12-08T14:15:00')
          }
        };
        
        setResponse(mockResponse);
        setMessages(mockResponse.chat?.messages || []);
      } catch (error) {
        console.error('Error loading response:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResponse();
  }, [id, isAuthenticated, currentUser, navigate]);

  const handleSendMessage = async (text: string, attachments?: File[]) => {
    if (!currentUser || !response) return;

    const isBuyer = currentUser.id === response.buyerId;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      orderId: response.id,
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

  const getStatusBadge = (status: Response['status']) => {
    const statusConfig = {
      pending: { label: 'Ожидает', variant: 'secondary' as const },
      accepted: { label: 'Принят', variant: 'default' as const },
      rejected: { label: 'Отклонён', variant: 'destructive' as const },
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

  if (!response) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-20">
            <Icon name="AlertCircle" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Отклик не найден</h2>
            <p className="text-muted-foreground">
              Отклик с таким ID не существует или был удалён
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isBuyer = currentUser?.id === response.buyerId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-6 flex-1">
        <BackButton />

        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold">Отклик #{response.responseNumber}</h1>
            {getStatusBadge(response.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(response.createdAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <ChatBox
              orderId={response.id}
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
                <CardTitle className="text-base">Информация об отклике</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm mb-2">{response.requestTitle}</h3>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Количество:</span>
                      <span className="font-medium">{response.quantity} {response.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Цена за {response.unit}:</span>
                      <span className="font-medium">{response.pricePerUnit.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Срок поставки:</span>
                      <span className="font-medium">{response.deliveryDays} дн.</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold">Итого:</span>
                      <span className="font-bold text-primary text-base">
                        {response.totalPrice.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                </div>

                {response.comment && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-1.5 text-xs">Комментарий</h4>
                      <p className="text-xs text-muted-foreground">{response.comment}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon name="User" className="h-4 w-4" />
                  {isBuyer ? 'Исполнитель' : 'Заказчик'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="font-semibold text-sm">
                    {isBuyer ? response.sellerName : response.buyerName}
                  </p>
                  <div className="space-y-1 text-xs mt-1.5">
                    <a
                      href={`tel:${isBuyer ? response.sellerPhone : ''}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon name="Phone" className="h-4 w-4" />
                      {isBuyer ? response.sellerPhone : 'Скрыто до принятия'}
                    </a>
                    <a
                      href={`mailto:${isBuyer ? response.sellerEmail : ''}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon name="Mail" className="h-4 w-4" />
                      {isBuyer ? response.sellerEmail : 'Скрыто до принятия'}
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