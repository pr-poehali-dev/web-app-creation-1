import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';
import { useOffers } from '@/contexts/OffersContext';
import type { Request as RequestType } from '@/types/offer';


interface MyRequestsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type RequestStatus = 'active' | 'draft' | 'closed' | 'archived';

interface Request {
  id: string;
  title: string;
  description: string;
  category: string;
  district: string;
  budget: number;
  quantity: number;
  unit: string;
  deadline: string;
  status: RequestStatus;
  responsesCount: number;
  views: number;
  createdAt: Date;
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  active: 'Активен',
  draft: 'Черновик',
  closed: 'Закрыт',
  archived: 'В архиве',
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  active: 'bg-green-500',
  draft: 'bg-gray-500',
  closed: 'bg-blue-500',
  archived: 'bg-slate-500',
};

export default function MyRequests({ isAuthenticated, onLogout }: MyRequestsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { districts } = useDistrict();
  const { requests: allRequests, deleteRequest } = useOffers();
  const currentUser = getSession();
  
  const [filterStatus, setFilterStatus] = useState<'all' | RequestStatus>('all');
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, [isAuthenticated, currentUser, navigate]);

  const myRequests: Request[] = allRequests
    .filter(request => request.userId === currentUser?.id)
    .map(request => ({
      id: request.id,
      title: request.title,
      description: request.description,
      category: request.category,
      district: request.district,
      budget: request.pricePerUnit * request.quantity,
      quantity: request.quantity,
      unit: request.unit,
      deadline: request.expiryDate?.toISOString().split('T')[0] || '',
      status: (request.status as RequestStatus) || 'active',
      responsesCount: request.responses || 0,
      views: request.views || 0,
      createdAt: request.createdAt,
    }));

  const filteredRequests = filterStatus === 'all' 
    ? myRequests 
    : myRequests.filter(request => request.status === filterStatus);

  const handleDeleteRequest = (requestId: string) => {
    deleteRequest(requestId);
    setRequestToDelete(null);
    toast({
      title: 'Успешно',
      description: 'Запрос удален',
    });
  };

  const handleCloseRequest = (requestId: string) => {
    toast({
      title: 'Успешно',
      description: 'Запрос закрыт',
    });
  };

  const handleActivateRequest = (requestId: string) => {
    toast({
      title: 'Успешно',
      description: 'Запрос опубликован',
    });
  };

  const getRequestStats = () => {
    return {
      total: myRequests.length,
      active: myRequests.filter(r => r.status === 'active').length,
      draft: myRequests.filter(r => r.status === 'draft').length,
      closed: myRequests.filter(r => r.status === 'closed').length,
      archived: myRequests.filter(r => r.status === 'archived').length,
    };
  };

  const stats = getRequestStats();

  const RequestCard = ({ request }: { request: Request }) => {
    const category = CATEGORIES.find(c => c.id === request.category);
    const districtName = districts.find(d => d.id === request.district)?.name;
    const daysLeft = Math.ceil((new Date(request.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">{request.title}</h3>
            <Badge className={STATUS_COLORS[request.status]}>
              {STATUS_LABELS[request.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {request.description}
          </p>

          {category && (
            <Badge variant="secondary">{category.name}</Badge>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Бюджет:</span>
              <span className="font-bold text-primary">
                {request.budget.toLocaleString()} ₽
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Объем:</span>
              <span className="font-medium">
                {request.quantity} {request.unit}
              </span>
            </div>
            {request.status === 'active' && daysLeft > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">До завершения:</span>
                <span className={`font-medium ${daysLeft <= 3 ? 'text-orange-500' : ''}`}>
                  {daysLeft} {daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дня' : 'дней'}
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon name="MessageSquare" className="h-4 w-4" />
                <span>{request.responsesCount}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Откликов</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon name="Eye" className="h-4 w-4" />
                <span>{request.views}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Просмотры</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon name="MapPin" className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{districtName}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled
          >
            <Icon name="Eye" className="mr-2 h-4 w-4" />
            Просмотр
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Icon name="MoreVertical" className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <Icon name="Pencil" className="mr-2 h-4 w-4" />
                Редактировать
              </DropdownMenuItem>
              {request.status === 'draft' && (
                <DropdownMenuItem onClick={() => handleActivateRequest(request.id)}>
                  <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                  Опубликовать
                </DropdownMenuItem>
              )}
              {request.status === 'active' && (
                <DropdownMenuItem onClick={() => handleCloseRequest(request.id)}>
                  <Icon name="XCircle" className="mr-2 h-4 w-4" />
                  Закрыть запрос
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setRequestToDelete(request.id)}
              >
                <Icon name="Trash2" className="mr-2 h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
            Назад
          </Button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Мои запросы</h1>
              <p className="text-muted-foreground mt-1">
                Управляйте своими запросами на покупку
              </p>
            </div>
            <Button onClick={() => navigate('/create-request')}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать запрос
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('all')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
              <p className="text-sm text-muted-foreground mt-1">Всего</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('active')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-green-500">{stats.active}</div>
              <p className="text-sm text-muted-foreground mt-1">Активных</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('draft')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-gray-500">{stats.draft}</div>
              <p className="text-sm text-muted-foreground mt-1">Черновики</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('closed')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.closed}</div>
              <p className="text-sm text-muted-foreground mt-1">Закрытых</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('archived')}>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-slate-500">{stats.archived}</div>
              <p className="text-sm text-muted-foreground mt-1">В архиве</p>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="h-96 animate-pulse bg-muted" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="FileText" className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-xl font-semibold mb-2">
              {filterStatus === 'all' ? 'У вас пока нет запросов' : `Нет запросов со статусом "${STATUS_LABELS[filterStatus]}"`}
            </h3>
            <p className="text-muted-foreground mb-8">
              Создайте запрос на покупку, чтобы получить предложения от поставщиков
            </p>
            <Button onClick={() => navigate('/create-request')}>
              <Icon name="Plus" className="mr-2 h-4 w-4" />
              Создать запрос
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Показано: <span className="font-semibold text-foreground">{filteredRequests.length}</span>{' '}
                {filterStatus !== 'all' && `из ${stats.total}`}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          </>
        )}
      </main>

      <AlertDialog open={!!requestToDelete} onOpenChange={() => setRequestToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запрос?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Запрос будет удален безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => requestToDelete && handleDeleteRequest(requestToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}