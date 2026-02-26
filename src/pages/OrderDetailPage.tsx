import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import ChatBox from '@/components/chat/ChatBox';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Icon from '@/components/ui/icon';
import { getSession } from '@/utils/auth';
import { ordersAPI } from '@/services/api';
import { getOrderRoles } from '@/utils/orderRoles';
import type { Order } from '@/types/order';
import type { ChatMessage } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

interface OrderDetailPageProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function OrderDetailPage({ isAuthenticated, onLogout }: OrderDetailPageProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = getSession();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersAPI.getOrderById(id);
      setOrder(data);
      const msgData = await ordersAPI.getMessagesByOrder(id);
      const mapped = (msgData.messages || []).map((m: Record<string, unknown>) => ({
        id: String(m.id),
        orderId: String(m.order_id || m.orderId || id),
        senderId: String(m.sender_id || m.senderId),
        senderName: String(m.sender_name || m.senderName || ''),
        senderType: (m.sender_type || m.senderType || 'buyer') as 'buyer' | 'seller',
        text: String(m.message || m.text || ''),
        timestamp: new Date(String(m.createdAt || m.created_at || new Date())),
        isRead: Boolean(m.is_read || m.isRead),
        attachments: (m.attachments as [] | undefined) || [],
      }));
      setMessages(mapped);
    } catch {
      setError('Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    loadOrder();
  }, [id, isAuthenticated]);

  const handleSendMessage = async (text: string) => {
    if (!currentUser || !order) return;
    const isBuyer = currentUser.id?.toString() === order.buyerId?.toString();
    try {
      await ordersAPI.createMessage({
        orderId: order.id,
        senderId: Number(currentUser.id),
        senderType: isBuyer ? 'buyer' : 'seller',
        message: text,
      });
      const msgData = await ordersAPI.getMessagesByOrder(order.id);
      setMessages(msgData.messages || []);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить сообщение', variant: 'destructive' });
    }
  };

  const handleAccept = async () => {
    if (!order) return;
    setIsActing(true);
    try {
      await ordersAPI.updateOrder(order.id, { status: 'accepted' });
      toast({ title: 'Отклик принят', description: 'Исполнитель получил уведомление' });
      await loadOrder();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось принять отклик', variant: 'destructive' });
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!order) return;
    setIsActing(true);
    try {
      await ordersAPI.updateOrder(order.id, { status: 'rejected' });
      toast({ title: 'Отклик отклонён' });
      await loadOrder();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отклонить', variant: 'destructive' });
    } finally {
      setIsActing(false);
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    setIsActing(true);
    try {
      await ordersAPI.updateOrder(order.id, { status: 'completed' });
      toast({ title: 'Заказ завершён' });
      await loadOrder();
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось завершить', variant: 'destructive' });
    } finally {
      setIsActing(false);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    const map: Record<string, { label: string; className: string }> = {
      new:         { label: 'Новый',       className: 'bg-blue-50 border-blue-200 text-blue-700' },
      pending:     { label: 'Ожидает',     className: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
      negotiating: { label: 'Торг',        className: 'bg-orange-50 border-orange-200 text-orange-700' },
      accepted:    { label: 'Принят',      className: 'bg-green-50 border-green-200 text-green-700' },
      rejected:    { label: 'Отклонён',    className: 'bg-red-50 border-red-200 text-red-700' },
      cancelled:   { label: 'Отменён',     className: 'bg-gray-100 border-gray-300 text-gray-600' },
      completed:   { label: 'Завершён',    className: 'bg-green-100 border-green-400 text-green-800' },
    };
    const cfg = map[status] || { label: status, className: '' };
    return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><Skeleton className="h-[500px] w-full" /></div>
            <div><Skeleton className="h-[350px] w-full" /></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="text-center py-20">
            <Icon name="AlertCircle" className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{error || 'Не найдено'}</h2>
            <Button variant="outline" onClick={() => navigate('/my-orders')}>
              Вернуться к заказам
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const userId = currentUser?.id?.toString();
  const isAuthor = userId === order.sellerId?.toString();   // автор запроса = seller
  const isResponder = userId === order.buyerId?.toString(); // откликнувшийся = buyer
  const roles = getOrderRoles(order);

  const counterpartName = isAuthor ? order.buyerName : order.sellerName;
  const counterpartPhone = isAuthor ? order.buyerPhone : order.sellerPhone;
  const counterpartEmail = isAuthor ? order.buyerEmail : order.sellerEmail;
  const counterpartRole = isAuthor ? roles.seller : roles.buyer;

  const canAccept = isAuthor && order.status === 'new';
  const canReject = isAuthor && (order.status === 'new' || order.status === 'negotiating');
  const canComplete = isResponder && order.status === 'accepted';

  const title = order.isRequest
    ? (isAuthor ? `Отклик на ваш запрос` : `Ваш отклик на запрос`)
    : `Заказ`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-6 flex-1">
        <BackButton />

        <div className="mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {order.offerTitle} · {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <ChatBox
              orderId={order.id}
              messages={messages}
              currentUserId={userId || ''}
              currentUserName={`${currentUser?.firstName} ${currentUser?.lastName}`}
              currentUserType={isAuthor ? 'seller' : 'buyer'}
              onSendMessage={handleSendMessage}
            />
          </div>

          <div className="space-y-3 order-1 lg:order-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Детали</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Количество</span>
                  <span className="font-medium">{order.quantity} {order.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Цена</span>
                  <span className="font-medium">{order.pricePerUnit?.toLocaleString('ru-RU')} ₽/{order.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Сумма</span>
                  <span className="font-bold text-primary">{order.totalAmount?.toLocaleString('ru-RU')} ₽</span>
                </div>
                {order.buyerComment && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground mb-1">Комментарий</p>
                      <p className="text-xs whitespace-pre-wrap">{order.buyerComment}</p>
                    </div>
                  </>
                )}
                {order.attachments && order.attachments.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground mb-1">Документы</p>
                      <div className="space-y-1">
                        {order.attachments.map((a, i) => (
                          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-primary hover:underline text-xs">
                            <Icon name="FileText" size={12} />
                            {a.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {order.status === 'accepted' && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-green-800 flex items-center gap-2">
                    <Icon name="UserCheck" size={16} />
                    Контакты {counterpartRole.toLowerCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  <p className="font-medium">{counterpartName}</p>
                  {counterpartPhone && (
                    <a href={`tel:${counterpartPhone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                      <Icon name="Phone" size={13} />
                      {counterpartPhone}
                    </a>
                  )}
                  {counterpartEmail && (
                    <a href={`mailto:${counterpartEmail}`} className="flex items-center gap-1.5 text-primary hover:underline">
                      <Icon name="Mail" size={13} />
                      {counterpartEmail}
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {(canAccept || canReject || canComplete) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Действия</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {canAccept && (
                    <Button className="w-full" onClick={handleAccept} disabled={isActing}>
                      <Icon name="Check" size={15} className="mr-1.5" />
                      Принять отклик
                    </Button>
                  )}
                  {canReject && (
                    <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleReject} disabled={isActing}>
                      <Icon name="X" size={15} className="mr-1.5" />
                      Отклонить
                    </Button>
                  )}
                  {canComplete && (
                    <Button variant="outline" className="w-full text-green-700 border-green-300 hover:bg-green-50"
                      onClick={handleComplete} disabled={isActing}>
                      <Icon name="CheckCheck" size={15} className="mr-1.5" />
                      Завершить
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}