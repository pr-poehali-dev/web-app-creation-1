import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import type { Request } from '@/types/offer';
import { requestsAPI, ordersAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { useDistrict } from '@/contexts/DistrictContext';
import { useOffers } from '@/contexts/OffersContext';

interface EditRequestProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface ChatMessage {
  id: string;
  orderId: string;
  orderNumber: string;
  sellerName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export default function EditRequest({ isAuthenticated, onLogout }: EditRequestProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  const { districts } = useDistrict();
  
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [responses, setResponses] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState('info');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteRequest } = useOffers();

  useEffect(() => {
    if (!currentUser || !isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const requestData = await requestsAPI.getRequestById(id);
        
        const mappedRequest: Request = {
          ...requestData,
          pricePerUnit: requestData.price_per_unit || requestData.pricePerUnit || 0,
          userId: requestData.user_id || requestData.userId,
          createdAt: new Date(requestData.createdAt || requestData.created_at),
        };

        if (mappedRequest.userId !== currentUser.id) {
          toast({
            title: 'Ошибка доступа',
            description: 'Вы не можете редактировать чужой запрос',
            variant: 'destructive',
          });
          navigate(`/request/${id}`);
          return;
        }
        
        setRequest(mappedRequest);
        
        const mockResponses = [
          {
            id: '1',
            sellerName: 'ООО "СтройМаркет"',
            price: mappedRequest.pricePerUnit * 0.95,
            message: 'Можем предложить по выгодной цене',
            timestamp: new Date(Date.now() - 7200000),
          },
          {
            id: '2',
            sellerName: 'ИП Иванов',
            price: mappedRequest.pricePerUnit,
            message: 'Есть в наличии, доставка бесплатная',
            timestamp: new Date(Date.now() - 14400000),
          }
        ];
        setResponses(mockResponses);

        const mockMessages: ChatMessage[] = mockResponses.map((resp, index) => ({
          id: `msg-${index}`,
          orderId: resp.id,
          orderNumber: `RSP-${resp.id}`,
          sellerName: resp.sellerName,
          message: resp.message,
          timestamp: resp.timestamp,
          isRead: index > 0,
        }));
        setMessages(mockMessages);
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Ошибка',
          description: 'Не удалось загрузить данные запроса',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOpenChat = (responseId: string) => {
    navigate(`/response-detail/${responseId}`);
  };

  const handleEdit = () => {
    if (!request) return;
    
    toast({
      title: 'Редактирование',
      description: 'Для изменения запроса удалите его и создайте новый с актуальными данными',
    });
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!request) return;
    
    try {
      deleteRequest(request.id);
      
      toast({
        title: 'Успешно',
        description: 'Запрос удалён',
      });
      
      setTimeout(() => {
        navigate('/zaprosy', { replace: true });
        window.location.reload();
      }, 500);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить запрос',
        variant: 'destructive',
      });
    }
  };

  const districtName = districts.find(d => d.id === request?.district)?.name || request?.district;
  const unreadCount = messages.filter(m => !m.isRead).length;

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex justify-center items-center h-64">
            <Icon name="Loader2" className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <Card>
            <CardContent className="py-8 text-center">
              <Icon name="AlertCircle" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Запрос не найден</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="container mx-auto px-4 py-8 flex-1 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
          Назад
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Управление запросом</h1>
          <Button onClick={() => navigate(`/request/${id}`)} variant="outline">
            <Icon name="Eye" className="w-4 h-4 mr-2" />
            Просмотр
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">
              <Icon name="Info" className="w-4 h-4 mr-2" />
              Информация
            </TabsTrigger>
            <TabsTrigger value="responses">
              <Icon name="Users" className="w-4 h-4 mr-2" />
              Отклики
              {responses.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {responses.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">
              <Icon name="MessageSquare" className="w-4 h-4 mr-2" />
              Сообщения
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold">{request.title}</h3>
                    <p className="text-muted-foreground mt-2">{request.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Бюджет за единицу:</span>
                      <p className="font-bold text-lg text-primary">
                        {request.pricePerUnit.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Количество:</span>
                      <p className="font-semibold">{request.quantity} {request.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Район:</span>
                      <p className="font-semibold">{districtName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Откликов:</span>
                      <p className="font-semibold">{request.responses || 0}</p>
                    </div>
                  </div>

                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleEdit}>
                      <Icon name="Pencil" className="w-4 h-4 mr-2" />
                      Редактировать
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                      <Icon name="Trash2" className="w-4 h-4 mr-2" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses" className="space-y-4">
            {responses.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="Users" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Пока нет откликов</h3>
                  <p className="text-muted-foreground">
                    Отклики на ваш запрос будут отображаться здесь
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {responses.map((response) => (
                  <Card key={response.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{response.sellerName}</h3>
                          <p className="text-sm text-muted-foreground">{response.message}</p>
                          <p className="text-sm font-semibold text-primary">
                            Предложение: {response.price.toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                        <Button onClick={() => handleOpenChat(response.id)}>
                          <Icon name="MessageSquare" className="w-4 h-4 mr-2" />
                          Открыть чат
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {messages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="MessageSquare" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Нет сообщений</h3>
                  <p className="text-muted-foreground">
                    Сообщения от продавцов будут отображаться здесь
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <Card 
                    key={message.id} 
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${!message.isRead ? 'border-primary' : ''}`}
                    onClick={() => handleOpenChat(message.orderId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon name="Store" className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{message.sellerName}</span>
                            {!message.isRead && (
                              <Badge variant="destructive" className="h-5">Новое</Badge>
                            )}
                          </div>
                          <p className="text-sm mt-2">{message.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp.toLocaleString('ru-RU')}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          <Icon name="Send" className="w-4 h-4 mr-2" />
                          Ответить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запрос?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Запрос будет удалён безвозвратно.
              {responses.length > 0 && (
                <span className="block mt-2 text-destructive font-semibold">
                  На этот запрос уже есть отклики ({responses.length}). Удаление может повлиять на них.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}