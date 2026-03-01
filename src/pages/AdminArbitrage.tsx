import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import func2url from '../../backend/func2url.json';

interface AdminArbitrageProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface OrderDetail {
  id: string;
  order_number?: string;
  orderNumber?: string;
  title: string;
  status: string;
  buyer_name?: string;
  buyerName?: string;
  buyer_phone?: string;
  buyerPhone?: string;
  buyer_email?: string;
  buyerEmail?: string;
  buyer_company?: string;
  buyerCompany?: string;
  seller_name?: string;
  sellerName?: string;
  seller_phone?: string;
  sellerPhone?: string;
  seller_email?: string;
  sellerEmail?: string;
  quantity: number;
  unit: string;
  price_per_unit?: number;
  pricePerUnit?: number;
  total_amount?: number;
  totalAmount?: number;
  counter_price_per_unit?: number;
  counterPricePerUnit?: number;
  counter_total_amount?: number;
  counterTotalAmount?: number;
  counter_offer_message?: string;
  counterOfferMessage?: string;
  delivery_type?: string;
  deliveryType?: string;
  delivery_address?: string;
  deliveryAddress?: string;
  buyer_comment?: string;
  buyerComment?: string;
  cancellation_reason?: string;
  cancellationReason?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  completed_date?: string;
  completedDate?: string;
  attachments?: { url: string; name: string }[];
}

interface Message {
  id: string;
  sender_name?: string;
  senderName?: string;
  sender_id?: number | string;
  senderId?: number | string;
  message: string;
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
  attachments?: { url: string; name?: string; type?: string }[];
  is_read?: boolean;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-blue-100 text-blue-800' },
  pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800' },
  negotiating: { label: 'Переговоры', color: 'bg-orange-100 text-orange-800' },
  accepted: { label: 'В работе', color: 'bg-green-100 text-green-800' },
  awaiting_payment: { label: 'Ждёт оплаты', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Завершён', color: 'bg-blue-100 text-blue-800' },
  rejected: { label: 'Отклонён', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Отменён', color: 'bg-red-100 text-red-700' },
  archived: { label: 'Архив', color: 'bg-gray-100 text-gray-600' },
};

function formatDate(val?: string | null) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return val;
  }
}

function formatMoney(val?: number | null) {
  if (val == null) return '—';
  return Number(val).toLocaleString('ru-RU') + ' ₽';
}

function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(url);
}

function isVideo(url: string) {
  return /\.(mp4|webm|mov|avi|mkv)/i.test(url);
}

export default function AdminArbitrage({ isAuthenticated, onLogout }: AdminArbitrageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [searchInput, setSearchInput] = useState('');
  const [searchedNumber, setSearchedNumber] = useState('');
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [mediaViewer, setMediaViewer] = useState<string | null>(null);
  const [adminDecision, setAdminDecision] = useState('');
  const [decisionDialog, setDecisionDialog] = useState(false);
  const [isSendingDecision, setIsSendingDecision] = useState(false);

  const ORDERS_API = func2url.orders;

  const getUserId = () => {
    try {
      const u = localStorage.getItem('currentUser');
      return u ? JSON.parse(u).id : null;
    } catch { return null; }
  };

  const searchOrder = async () => {
    const query = searchInput.trim();
    if (!query) return;
    setSearchedNumber(query);
    setOrder(null);
    setMessages([]);
    setIsLoadingOrder(true);

    try {
      const userId = getUserId();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (userId) headers['X-User-Id'] = String(userId);

      const response = await fetch(`${ORDERS_API}?orderNumber=${encodeURIComponent(query)}`, { headers });
      if (!response.ok) throw new Error('not found');
      const data = await response.json();

      if (data.orders && data.orders.length > 0) {
        setOrder(data.orders[0]);
        await loadMessages(data.orders[0].id);
      } else if (data.id) {
        setOrder(data);
        await loadMessages(data.id);
      } else {
        toast({ title: 'Заказ не найден', description: `По номеру "${query}" ничего не найдено`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось найти заказ', variant: 'destructive' });
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const loadMessages = async (orderId: string) => {
    setIsLoadingMessages(true);
    try {
      const userId = getUserId();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (userId) headers['X-User-Id'] = String(userId);
      const response = await fetch(`${ORDERS_API}?id=${orderId}&messages=true`, { headers });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (messages.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendAdminDecision = async () => {
    if (!order || !adminDecision.trim()) return;
    setIsSendingDecision(true);
    try {
      const userId = getUserId();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (userId) headers['X-User-Id'] = String(userId);

      const messageText = `⚖️ РЕШЕНИЕ АРБИТРА:\n${adminDecision.trim()}`;
      await fetch(`${ORDERS_API}?message=true`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId: order.id, message: messageText }),
      });
      toast({ title: 'Решение отправлено', description: 'Сообщение добавлено в чат заказа' });
      setAdminDecision('');
      setDecisionDialog(false);
      await loadMessages(order.id);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось отправить решение', variant: 'destructive' });
    } finally {
      setIsSendingDecision(false);
    }
  };

  const orderNumber = order?.order_number || order?.orderNumber || order?.id?.slice(0, 8);
  const status = order?.status || '';
  const statusInfo = STATUS_MAP[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  const pricePerUnit = order?.counter_price_per_unit || order?.counterPricePerUnit || order?.price_per_unit || order?.pricePerUnit;
  const totalAmount = order?.counter_total_amount || order?.counterTotalAmount || order?.total_amount || order?.totalAmount;
  const buyerName = order?.buyer_name || order?.buyerName || '—';
  const sellerName = order?.seller_name || order?.sellerName || '—';

  const allAttachments: { url: string; name?: string; source: string }[] = [];
  if (order?.attachments) {
    order.attachments.forEach(a => allAttachments.push({ ...a, source: 'Заказ' }));
  }
  messages.forEach(m => {
    if (m.attachments) {
      m.attachments.forEach(a => allAttachments.push({ url: a.url, name: a.name, source: m.sender_name || m.senderName || '—' }));
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/admin/panel')} className="mb-6">
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
          Назад в админ-панель
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
            <Icon name="Scale" className="w-8 h-8 text-primary" />
            Арбитраж заказов
          </h1>
          <p className="text-muted-foreground">Просмотр заказа, переписки и файлов для разрешения споров</p>
        </div>

        {/* Поиск */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label className="text-base font-semibold mb-3 block">Поиск по номеру заказа</Label>
            <div className="flex gap-3">
              <Input
                placeholder="Например: ORD-20260225-1234"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchOrder()}
                className="flex-1 text-base"
              />
              <Button onClick={searchOrder} disabled={isLoadingOrder || !searchInput.trim()} className="px-6">
                {isLoadingOrder
                  ? <Icon name="Loader2" className="w-4 h-4 animate-spin" />
                  : <Icon name="Search" className="w-4 h-4 mr-2" />}
                {!isLoadingOrder && 'Найти'}
              </Button>
            </div>
            {searchedNumber && !order && !isLoadingOrder && (
              <p className="text-sm text-destructive mt-2">Заказ «{searchedNumber}» не найден</p>
            )}
          </CardContent>
        </Card>

        {order && (
          <div className="space-y-6">
            {/* Шапка заказа */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-xl mb-1">Заказ №{orderNumber}</CardTitle>
                    <p className="text-muted-foreground text-sm">{order.title}</p>
                  </div>
                  <Badge className={`${statusInfo.color} text-sm px-3 py-1`}>{statusInfo.label}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Покупатель */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-blue-700">
                      <Icon name="User" className="w-4 h-4" /> Покупатель
                    </h3>
                    <div className="bg-blue-50 rounded-lg p-3 space-y-1 text-sm">
                      <p className="font-medium">{buyerName}</p>
                      {(order.buyer_company || order.buyerCompany) && (
                        <p className="text-muted-foreground">{order.buyer_company || order.buyerCompany}</p>
                      )}
                      {(order.buyer_phone || order.buyerPhone) && (
                        <p className="flex items-center gap-1">
                          <Icon name="Phone" className="w-3 h-3" />
                          {order.buyer_phone || order.buyerPhone}
                        </p>
                      )}
                      {(order.buyer_email || order.buyerEmail) && (
                        <p className="flex items-center gap-1">
                          <Icon name="Mail" className="w-3 h-3" />
                          {order.buyer_email || order.buyerEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Продавец */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-green-700">
                      <Icon name="Store" className="w-4 h-4" /> Продавец / Исполнитель
                    </h3>
                    <div className="bg-green-50 rounded-lg p-3 space-y-1 text-sm">
                      <p className="font-medium">{sellerName}</p>
                      {(order.seller_phone || order.sellerPhone) && (
                        <p className="flex items-center gap-1">
                          <Icon name="Phone" className="w-3 h-3" />
                          {order.seller_phone || order.sellerPhone}
                        </p>
                      )}
                      {(order.seller_email || order.sellerEmail) && (
                        <p className="flex items-center gap-1">
                          <Icon name="Mail" className="w-3 h-3" />
                          {order.seller_email || order.sellerEmail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Финансовые данные */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Количество</p>
                    <p className="font-bold text-lg">{order.quantity} {order.unit}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Цена за ед.</p>
                    <p className="font-bold text-lg text-primary">{formatMoney(pricePerUnit)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                    <p className="text-xs text-muted-foreground mb-1">Итого (принятая цена)</p>
                    <p className="font-bold text-lg text-green-700">{formatMoney(totalAmount)}</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Доставка</p>
                    <p className="font-bold text-sm">{order.delivery_type === 'pickup' || order.deliveryType === 'pickup' ? 'Самовывоз' : 'Доставка'}</p>
                  </div>
                </div>

                {/* Встречная цена если была */}
                {(order.counter_price_per_unit || order.counterPricePerUnit) && (
                  <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-orange-800 mb-1">История торга (встречное предложение)</p>
                    <p className="text-sm">Встречная цена: <strong>{formatMoney(order.counter_price_per_unit || order.counterPricePerUnit)}</strong> за ед.</p>
                    {(order.counter_offer_message || order.counterOfferMessage) && (
                      <p className="text-sm mt-1 text-muted-foreground">«{order.counter_offer_message || order.counterOfferMessage}»</p>
                    )}
                  </div>
                )}

                {/* Комментарий покупателя */}
                {(order.buyer_comment || order.buyerComment) && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">Комментарий покупателя</p>
                    <p className="text-sm">{order.buyer_comment || order.buyerComment}</p>
                  </div>
                )}

                {/* Причина отмены */}
                {(order.cancellation_reason || order.cancellationReason) && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Причина отмены / отклонения</p>
                    <p className="text-sm">{order.cancellation_reason || order.cancellationReason}</p>
                  </div>
                )}

                <Separator className="my-4" />
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span>Создан: {formatDate(order.created_at || order.createdAt)}</span>
                  {(order.updated_at || order.updatedAt) && (
                    <span>Обновлён: {formatDate(order.updated_at || order.updatedAt)}</span>
                  )}
                  {(order.completed_date || order.completedDate) && (
                    <span className="text-green-600">Завершён: {formatDate(order.completed_date || order.completedDate)}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Чат */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="MessageSquare" className="w-5 h-5" />
                  Переписка ({messages.length} сообщений)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Icon name="Loader2" className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Сообщений нет</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {messages.map((msg, idx) => {
                      const senderName = msg.sender_name || msg.senderName || 'Неизвестно';
                      const time = formatDate(msg.created_at || msg.createdAt || msg.timestamp);
                      const isArbitrage = msg.message?.startsWith('⚖️');
                      return (
                        <div
                          key={msg.id || idx}
                          className={`rounded-lg p-3 text-sm ${
                            isArbitrage
                              ? 'bg-purple-50 border border-purple-300'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-semibold ${isArbitrage ? 'text-purple-700' : 'text-foreground'}`}>
                              {isArbitrage ? '⚖️ Арбитр' : senderName}
                            </span>
                            <span className="text-xs text-muted-foreground">{time}</span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {msg.attachments.map((att, ai) => (
                                <button
                                  key={ai}
                                  onClick={() => setMediaViewer(att.url)}
                                  className="relative overflow-hidden rounded border bg-background hover:opacity-80 transition"
                                >
                                  {isImage(att.url) ? (
                                    <img src={att.url} alt={att.name || 'фото'} className="h-20 w-20 object-cover" />
                                  ) : isVideo(att.url) ? (
                                    <div className="h-20 w-20 flex items-center justify-center bg-black/10">
                                      <Icon name="Play" className="w-6 h-6 text-primary" />
                                    </div>
                                  ) : (
                                    <div className="h-20 w-20 flex flex-col items-center justify-center gap-1 p-2">
                                      <Icon name="FileText" className="w-6 h-6 text-muted-foreground" />
                                      <span className="text-xs text-center truncate w-full">{att.name || 'файл'}</span>
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Все файлы */}
            {allAttachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Paperclip" className="w-5 h-5" />
                    Все фото и файлы ({allAttachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {allAttachments.map((att, idx) => (
                      <div key={idx} className="space-y-1">
                        <button
                          onClick={() => setMediaViewer(att.url)}
                          className="w-full aspect-square rounded-lg border overflow-hidden hover:opacity-80 transition bg-muted"
                        >
                          {isImage(att.url) ? (
                            <img src={att.url} alt={att.name || 'фото'} className="w-full h-full object-cover" />
                          ) : isVideo(att.url) ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 bg-black/5">
                              <Icon name="PlayCircle" className="w-8 h-8 text-primary" />
                              <span className="text-xs text-muted-foreground">видео</span>
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                              <Icon name="FileText" className="w-8 h-8 text-muted-foreground" />
                              <span className="text-xs text-center truncate w-full">{att.name || 'файл'}</span>
                            </div>
                          )}
                        </button>
                        <p className="text-xs text-muted-foreground text-center truncate">{att.source}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Кнопка решения арбитра */}
            <div className="flex gap-3">
              <Button
                onClick={() => setDecisionDialog(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                <Icon name="Scale" className="w-5 h-5 mr-2" />
                Вынести решение арбитра
              </Button>
              <Button variant="outline" size="lg" onClick={() => loadMessages(order.id)}>
                <Icon name="RefreshCw" className="w-4 h-4 mr-2" />
                Обновить
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Диалог решения */}
      <Dialog open={decisionDialog} onOpenChange={setDecisionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="Scale" className="w-5 h-5 text-purple-600" />
              Решение арбитра по заказу №{orderNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Ваше решение будет добавлено в чат заказа и видно обеим сторонам.
            </p>
            <Textarea
              placeholder="Опишите решение арбитра..."
              value={adminDecision}
              onChange={e => setAdminDecision(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialog(false)}>Отмена</Button>
            <Button
              onClick={sendAdminDecision}
              disabled={!adminDecision.trim() || isSendingDecision}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSendingDecision
                ? <Icon name="Loader2" className="w-4 h-4 animate-spin mr-2" />
                : <Icon name="Send" className="w-4 h-4 mr-2" />}
              Отправить решение
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Просмотрщик медиа */}
      {mediaViewer && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setMediaViewer(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition"
            onClick={() => setMediaViewer(null)}
          >
            <Icon name="X" className="w-6 h-6" />
          </button>
          {isVideo(mediaViewer) ? (
            <video
              src={mediaViewer}
              controls
              autoPlay
              className="max-w-full max-h-[90vh] rounded-lg"
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <img
              src={mediaViewer}
              alt="медиа"
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
              onClick={e => e.stopPropagation()}
            />
          )}
          <a
            href={mediaViewer}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 text-white bg-white/20 rounded-full px-4 py-2 text-sm hover:bg-white/30 transition"
            onClick={e => e.stopPropagation()}
          >
            <Icon name="Download" className="w-4 h-4 inline mr-1" />
            Скачать
          </a>
        </div>
      )}
    </div>
  );
}
