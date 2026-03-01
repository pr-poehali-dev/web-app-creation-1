import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import func2url from '../../backend/func2url.json';
import { OrderDetail, Message, normalizeOrder, STATUS_MAP } from './arbitrage/types';
import ArbitrageOrderCard from './arbitrage/ArbitrageOrderCard';
import ArbitrageChatPanel from './arbitrage/ArbitrageChatPanel';
import { DecisionDialog, StatusDialog, MediaViewer } from './arbitrage/ArbitrageDialogs';

interface AdminArbitrageProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminArbitrage({ isAuthenticated, onLogout }: AdminArbitrageProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

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
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const ORDERS_API = func2url.orders;

  const getUserId = () => {
    try {
      const u = localStorage.getItem('currentUser');
      return u ? JSON.parse(u).id : null;
    } catch { return null; }
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

  const searchOrder = async () => {
    const query = searchInput.trim().replace(/^[№#\s]+/, '');
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

      if (data.id) {
        const normalized = normalizeOrder(data);
        setOrder(normalized);
        await loadMessages(data.id);
      } else if (data.orders && data.orders.length > 0) {
        const normalized = normalizeOrder(data.orders[0]);
        setOrder(normalized);
        await loadMessages(data.orders[0].id);
      } else {
        toast({ title: 'Заказ не найден', description: `По номеру "${query}" ничего не найдено`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось найти заказ', variant: 'destructive' });
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const changeOrderStatus = async () => {
    if (!order || !newStatus) return;
    setIsChangingStatus(true);
    try {
      const userId = getUserId();
      const headers: HeadersInit = { 'Content-Type': 'application/json', 'X-User-Id': String(userId || '') };

      const body: Record<string, string> = { status: newStatus };
      if (statusReason.trim()) body.cancellationReason = statusReason.trim();

      const response = await fetch(`${ORDERS_API}?id=${order.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Ошибка');

      const noticeText = `⚖️ АРБИТР изменил статус заказа на «${STATUS_MAP[newStatus]?.label || newStatus}»${statusReason.trim() ? `.\nПричина: ${statusReason.trim()}` : ''}`;
      await fetch(`${ORDERS_API}?message=true`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ orderId: order.id, message: noticeText }),
      });

      setOrder(prev => prev ? { ...prev, status: newStatus } : prev);
      toast({ title: 'Статус изменён', description: `Новый статус: ${STATUS_MAP[newStatus]?.label || newStatus}` });
      setStatusDialog(false);
      setStatusReason('');
      await loadMessages(order.id);
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось изменить статус', variant: 'destructive' });
    } finally {
      setIsChangingStatus(false);
    }
  };

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
            <ArbitrageOrderCard order={order} />

            <ArbitrageChatPanel
              order={order}
              messages={messages}
              isLoadingMessages={isLoadingMessages}
              onOpenDecisionDialog={() => setDecisionDialog(true)}
              onOpenStatusDialog={() => { setNewStatus(''); setStatusReason(''); setStatusDialog(true); }}
              onRefresh={() => loadMessages(order.id)}
              onMediaOpen={setMediaViewer}
            />
          </div>
        )}
      </main>

      <DecisionDialog
        open={decisionDialog}
        onOpenChange={setDecisionDialog}
        orderNumber={orderNumber}
        adminDecision={adminDecision}
        onDecisionChange={setAdminDecision}
        onSend={sendAdminDecision}
        isSending={isSendingDecision}
      />

      <StatusDialog
        open={statusDialog}
        onOpenChange={setStatusDialog}
        orderNumber={orderNumber}
        currentStatus={order?.status || ''}
        newStatus={newStatus}
        onNewStatusChange={setNewStatus}
        statusReason={statusReason}
        onStatusReasonChange={setStatusReason}
        onApply={changeOrderStatus}
        isChanging={isChangingStatus}
      />

      <MediaViewer url={mediaViewer} onClose={() => setMediaViewer(null)} />
    </div>
  );
}
