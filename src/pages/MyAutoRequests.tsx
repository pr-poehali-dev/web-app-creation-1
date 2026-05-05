import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import { requestsAPI } from '@/services/api';
import type { Request } from '@/types/offer';
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

interface MyAutoRequestsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Активно',
  closed: 'Закрыто',
  archived: 'В архиве',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  closed: 'bg-slate-100 text-slate-800',
  archived: 'bg-slate-100 text-slate-800',
};

export default function MyAutoRequests({ isAuthenticated, onLogout }: MyAutoRequestsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();

  const [isLoading, setIsLoading] = useState(true);
  const [autoRequests, setAutoRequests] = useState<Request[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed' | 'archived'>('all');
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }
    loadAutoRequests();
  }, [isAuthenticated]);

  const loadAutoRequests = async () => {
    try {
      setIsLoading(true);
      const response = await requestsAPI.getRequests({
        status: 'all',
        userId: currentUser!.id,
        limit: 100,
        category: 'auto-sale',
      });
      const filtered = (response.requests || []).filter((r: Request) => r.category === 'auto-sale');
      setAutoRequests(filtered);
    } catch (error) {
      console.error('Ошибка загрузки запросов авто:', error);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить запросы', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      await requestsAPI.deleteRequest(requestId);
      setAutoRequests(prev => prev.filter(r => r.id !== requestId));
      toast({ title: 'Удалено', description: 'Запрос удалён' });
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось удалить запрос', variant: 'destructive' });
    }
    setRequestToDelete(null);
  };

  const handleEdit = (requestId: string) => {
    navigate(`/create-request?edit=${requestId}`);
  };

  const filteredRequests = autoRequests.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  const stats = {
    total: autoRequests.length,
    active: autoRequests.filter(r => r.status === 'active').length,
    closed: autoRequests.filter(r => r.status === 'closed' || r.status === 'archived').length,
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(price);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <BackButton />

          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Мои запросы авто</h1>
              <p className="text-muted-foreground">Запросы на покупку автомобилей</p>
            </div>
            <Button onClick={() => navigate('/create-request')}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать запрос
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Всего</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Активных</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <div className="text-2xl font-bold text-slate-500">{stats.closed}</div>
                <div className="text-sm text-muted-foreground">Закрыто</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {(['all', 'active', 'closed'] as const).map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === 'all' ? 'Все' : STATUS_LABELS[status]}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Search" className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Нет запросов</h3>
                <p className="text-muted-foreground mb-4">
                  {filterStatus === 'all'
                    ? 'У вас ещё нет запросов на покупку автомобилей'
                    : `Нет запросов со статусом "${STATUS_LABELS[filterStatus]}"`}
                </p>
                <Button onClick={() => navigate('/create-request')}>
                  <Icon name="Plus" className="mr-2 h-4 w-4" />
                  Создать запрос
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map(request => (
                <Card key={request.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-lg truncate">{request.title}</h3>
                          <Badge className={STATUS_COLORS[request.status || 'active']}>
                            {STATUS_LABELS[request.status || 'active']}
                          </Badge>
                        </div>
                        {request.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                        )}
                      </div>
                      {request.budget && (
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg font-bold text-primary">
                            до {formatPrice(request.budget)}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Icon name="Eye" className="h-3 w-3" />
                        {request.views || 0} просмотров
                      </span>
                      {request.responses !== undefined && (
                        <span className="flex items-center gap-1">
                          <Icon name="MessageSquare" className="h-3 w-3" />
                          {request.responses} откликов
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Icon name="Calendar" className="h-3 w-3" />
                        {new Date(request.createdAt).toLocaleDateString('ru-RU')}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/requests/${request.id}`)}
                      >
                        <Icon name="Eye" className="mr-1 h-3 w-3" />
                        Просмотр
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(request.id)}
                      >
                        <Icon name="Pencil" className="mr-1 h-3 w-3" />
                        Редактировать
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRequestToDelete(request.id)}
                      >
                        <Icon name="Trash2" className="mr-1 h-3 w-3" />
                        Удалить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <AlertDialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запрос?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => requestToDelete && handleDelete(requestToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
