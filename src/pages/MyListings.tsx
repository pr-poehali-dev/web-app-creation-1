import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useOffers } from '@/contexts/OffersContext';
import { ordersAPI, type Order } from '@/services/api';
import type { Offer, Request as RequestType } from '@/types/offer';
import { CATEGORIES } from '@/data/categories';
import { useDistrict } from '@/contexts/DistrictContext';

interface MyListingsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

type ListingType = 'offer' | 'request';
type ListingStatus = 'active' | 'draft' | 'in_order' | 'completed' | 'archived';

interface ListingItem {
  id: string;
  type: ListingType;
  title: string;
  description: string;
  category: string;
  district: string;
  price: number;
  quantity: number;
  unit: string;
  status: ListingStatus;
  views: number;
  favorites?: number;
  responses?: number;
  images?: Array<{ url: string; alt: string }>;
  isPremium?: boolean;
  orderId?: string;
  orderStatus?: string;
  createdAt: Date;
}

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: 'Активно',
  draft: 'Черновик',
  in_order: 'В заказе',
  completed: 'Завершено',
  archived: 'В архиве',
};

const STATUS_COLORS: Record<ListingStatus, string> = {
  active: 'bg-green-500',
  draft: 'bg-gray-500',
  in_order: 'bg-blue-500',
  completed: 'bg-purple-500',
  archived: 'bg-slate-500',
};

export default function MyListings({ isAuthenticated, onLogout }: MyListingsProps) {
  useScrollToTop();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { districts } = useDistrict();
  const { offers: allOffers, requests: allRequests, deleteOffer, deleteRequest } = useOffers();
  const currentUser = getSession();
  
  const [filterStatus, setFilterStatus] = useState<'all' | ListingStatus>('all');
  const [filterType, setFilterType] = useState<'all' | ListingType>('all');
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: ListingType } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      navigate('/login');
      return;
    }

    const loadOrders = async () => {
      try {
        const ordersData = await ordersAPI.getAll();
        setOrders(ordersData);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, currentUser, navigate]);

  const getListingStatus = (itemId: string, originalStatus: string): ListingStatus => {
    const relatedOrder = orders.find(order => order.offerId === itemId);
    
    if (relatedOrder) {
      if (relatedOrder.status === 'completed') return 'completed';
      if (relatedOrder.status === 'cancelled') return originalStatus as ListingStatus;
      return 'in_order';
    }
    
    return originalStatus as ListingStatus;
  };

  const myListings: ListingItem[] = [
    ...allOffers
      .filter(offer => offer.userId === currentUser?.id)
      .map(offer => {
        const relatedOrder = orders.find(order => order.offerId === offer.id);
        const status = getListingStatus(offer.id, offer.status || 'active');
        
        return {
          id: offer.id,
          type: 'offer' as ListingType,
          title: offer.title,
          description: offer.description,
          category: offer.category,
          district: offer.district,
          price: offer.pricePerUnit,
          quantity: offer.quantity,
          unit: offer.unit,
          status,
          views: offer.views || 0,
          favorites: 0,
          images: offer.images,
          isPremium: offer.isPremium,
          orderId: relatedOrder?.id,
          orderStatus: relatedOrder?.status,
          createdAt: offer.createdAt,
        };
      }),
    ...allRequests
      .filter(request => request.userId === currentUser?.id)
      .map(request => {
        const relatedOrder = orders.find(order => order.offerId === request.id);
        const status = getListingStatus(request.id, request.status || 'active');
        
        return {
          id: request.id,
          type: 'request' as ListingType,
          title: request.title,
          description: request.description,
          category: request.category,
          district: request.district,
          price: request.pricePerUnit * request.quantity,
          quantity: request.quantity,
          unit: request.unit,
          status,
          views: request.views || 0,
          responses: request.responses || 0,
          orderId: relatedOrder?.id,
          orderStatus: relatedOrder?.status,
          createdAt: request.createdAt,
        };
      }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const filteredListings = myListings.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  const handleDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'offer') {
      deleteOffer(itemToDelete.id);
    } else {
      deleteRequest(itemToDelete.id);
    }
    
    setItemToDelete(null);
    toast({
      title: 'Успешно',
      description: 'Объявление удалено',
    });
  };

  const getStats = () => {
    return {
      total: myListings.length,
      active: myListings.filter(i => i.status === 'active').length,
      in_order: myListings.filter(i => i.status === 'in_order').length,
      completed: myListings.filter(i => i.status === 'completed').length,
      offers: myListings.filter(i => i.type === 'offer').length,
      requests: myListings.filter(i => i.type === 'request').length,
    };
  };

  const stats = getStats();

  const ListingCard = ({ item }: { item: ListingItem }) => {
    const category = CATEGORIES.find(c => c.id === item.category);
    const districtName = districts.find(d => d.id === item.district)?.name;

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="p-0">
          <div className="relative aspect-video bg-muted overflow-hidden">
            {item.type === 'offer' && item.images && item.images.length > 0 ? (
              <img
                src={item.images[0].url}
                alt={item.images[0].alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon 
                  name={item.type === 'offer' ? 'Package' : 'ShoppingBag'} 
                  className="h-12 w-12 text-muted-foreground" 
                />
              </div>
            )}
            <div className="absolute top-2 left-2 flex gap-2">
              <Badge variant={item.type === 'offer' ? 'default' : 'secondary'}>
                {item.type === 'offer' ? (
                  <>
                    <Icon name="Store" className="h-3 w-3 mr-1" />
                    Предложение
                  </>
                ) : (
                  <>
                    <Icon name="ShoppingCart" className="h-3 w-3 mr-1" />
                    Запрос
                  </>
                )}
              </Badge>
              <Badge className={STATUS_COLORS[item.status]}>
                {STATUS_LABELS[item.status]}
              </Badge>
            </div>
            {item.isPremium && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary">
                  <Icon name="Star" className="h-3 w-3 mr-1" />
                  Премиум
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
          </div>

          {category && (
            <Badge variant="outline">{category.name}</Badge>
          )}

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {item.type === 'offer' ? 'Цена' : 'Бюджет'}:
            </span>
            <span className="font-bold text-lg text-primary">
              {item.price.toLocaleString()} ₽
            </span>
          </div>

          {item.orderId && (
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Icon name="Package" className="h-3 w-3" />
                  Заказ №{item.orderId.slice(0, 8)}
                </span>
                <Button
                  size="sm"
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => navigate(`/order-detail/${item.orderId}`)}
                >
                  Детали →
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2 border-t text-sm">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon name="Eye" className="h-4 w-4" />
                <span>{item.views}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Просмотры</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Icon 
                  name={item.type === 'offer' ? 'Heart' : 'MessageSquare'} 
                  className="h-4 w-4" 
                />
                <span>{item.favorites || item.responses || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.type === 'offer' ? 'Избранное' : 'Отклики'}
              </p>
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
            onClick={() => navigate(`/offer/${item.id}`)}
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
              {item.status === 'active' && (
                <DropdownMenuItem disabled>
                  <Icon name="Archive" className="mr-2 h-4 w-4" />
                  В архив
                </DropdownMenuItem>
              )}
              {item.status === 'archived' && (
                <DropdownMenuItem disabled>
                  <Icon name="ArchiveRestore" className="mr-2 h-4 w-4" />
                  Восстановить
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setItemToDelete({ id: item.id, type: item.type })}
                className="text-red-600"
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

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Мои объявления</h1>
            <p className="text-muted-foreground">
              Управляйте своими предложениями и запросами
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{stats.total}</p>
                  <p className="text-sm text-muted-foreground mt-1">Всего</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">{stats.active}</p>
                  <p className="text-sm text-muted-foreground mt-1">Активных</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500">{stats.in_order}</p>
                  <p className="text-sm text-muted-foreground mt-1">В заказах</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-500">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground mt-1">Завершено</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{stats.offers}/{stats.requests}</p>
                  <p className="text-sm text-muted-foreground mt-1">Пред./Запр.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | ListingStatus)}>
            <TabsList className="mb-6 flex-wrap h-auto">
              <TabsTrigger value="all">
                Все ({stats.total})
              </TabsTrigger>
              <TabsTrigger value="active">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                Активные ({stats.active})
              </TabsTrigger>
              <TabsTrigger value="in_order">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                В заказах ({stats.in_order})
              </TabsTrigger>
              <TabsTrigger value="completed">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                Завершенные ({stats.completed})
              </TabsTrigger>
            </TabsList>

            <div className="mb-4 flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                Все
              </Button>
              <Button
                variant={filterType === 'offer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('offer')}
              >
                <Icon name="Store" className="mr-2 h-4 w-4" />
                Предложения
              </Button>
              <Button
                variant={filterType === 'request' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('request')}
              >
                <Icon name="ShoppingCart" className="mr-2 h-4 w-4" />
                Запросы
              </Button>
            </div>

            <TabsContent value={filterStatus} className="mt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              ) : filteredListings.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Icon name="Package" className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Нет объявлений</h3>
                      <p className="text-muted-foreground mb-6">
                        {filterStatus === 'all'
                          ? 'У вас пока нет размещенных объявлений'
                          : `Нет объявлений со статусом "${STATUS_LABELS[filterStatus]}"`}
                      </p>
                      <Button onClick={() => navigate('/')}>
                        <Icon name="Plus" className="mr-2 h-4 w-4" />
                        Создать объявление
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map(item => (
                    <ListingCard key={`${item.type}-${item.id}`} item={item} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить объявление?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Объявление будет удалено безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
