import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useDistrict } from '@/contexts/DistrictContext';
import ListingCard from '@/components/listings/ListingCard';
import ListingsStats from '@/components/listings/ListingsStats';
import ListingsFilters from '@/components/listings/ListingsFilters';

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
  unreadMessages?: number;
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
        const response = await ordersAPI.getAll('sale');
        setOrders(response.orders || []);
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
          unreadMessages: relatedOrder ? 2 : 0,
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
          unreadMessages: relatedOrder ? 2 : 0,
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

          <ListingsStats stats={stats} />

          <ListingsFilters
            filterStatus={filterStatus}
            filterType={filterType}
            onStatusChange={setFilterStatus}
            onTypeChange={setFilterType}
            stats={stats}
          />

          <div className="mt-0">
            {filteredListings.length === 0 ? (
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
                  <ListingCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    districts={districts}
                    onDelete={(id, type) => setItemToDelete({ id, type })}
                    statusColors={STATUS_COLORS}
                    statusLabels={STATUS_LABELS}
                  />
                ))}
              </div>
            )}
          </div>
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