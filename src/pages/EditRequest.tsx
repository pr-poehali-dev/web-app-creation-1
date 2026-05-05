import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Request } from '@/types/offer';
import { requestsAPI, ordersAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { useOffers } from '@/contexts/OffersContext';
import { notifyRequestUpdated } from '@/utils/dataSync';
import EditRequestHeader from '@/components/edit-request/EditRequestHeader';
import EditRequestTabs from '@/components/edit-request/EditRequestTabs';
import EditRequestDeleteDialog from '@/components/edit-request/EditRequestDeleteDialog';
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

interface EditRequestProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function EditRequest({ isAuthenticated, onLogout }: EditRequestProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const currentUser = getSession();
  
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [responseOrders, setResponseOrders] = useState<object[]>([]);
  const { deleteRequest, updateRequest } = useOffers();
  
  const publishMode = searchParams.get('publish') === '1';

  useEffect(() => {
    if (!currentUser || !isAuthenticated) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const [requestData, ordersResponse] = await Promise.all([
          requestsAPI.getRequestById(id),
          ordersAPI.getAll('sale'),
        ]);
        
        const mappedRequest: Request = {
          ...requestData,
          pricePerUnit: requestData.price_per_unit || requestData.pricePerUnit || 0,
          userId: requestData.user_id || requestData.userId,
          createdAt: new Date(requestData.createdAt || requestData.created_at),
        };

        if (String(mappedRequest.userId) !== String(currentUser.id)) {
          toast({
            title: 'Ошибка доступа',
            description: 'Вы не можете редактировать чужой запрос',
            variant: 'destructive',
          });
          navigate(`/request/${id}`);
          return;
        }
        
        setRequest(mappedRequest);

        const allOrders = ordersResponse.orders || [];
        const related = allOrders.filter((o: Record<string, unknown>) =>
          (o.request_id || o.requestId) === id
        ).map((o: Record<string, unknown>) => ({
          id: o.id,
          sellerName: o.seller_name || o.sellerName || o.seller_full_name || 'Исполнитель',
          buyerName: o.buyer_name || o.buyerName,
          status: o.status || 'pending',
          totalAmount: o.total_amount || o.totalAmount,
          counterTotalAmount: o.counter_total_amount || o.counterTotalAmount,
          transportPrice: o.transport_price || o.transportPrice,
        }));
        setResponseOrders(related);
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

  useEffect(() => {
    if (publishMode && request && request.status === 'closed') {
      setShowPublishDialog(true);
    }
  }, [publishMode, request]);

  const confirmPublish = async () => {
    if (!request) return;
    setIsPublishing(true);
    try {
      await requestsAPI.updateRequest(request.id, { status: 'active' });
      updateRequest(request.id, { status: 'active' });
      setRequest(prev => prev ? { ...prev, status: 'active' } : prev);
      setShowPublishDialog(false);
      toast({ title: 'Опубликовано', description: 'Запрос снова активен и виден покупателям' });
      navigate('/moi-zaprosy', { replace: true });
    } catch {
      toast({ title: 'Ошибка', description: 'Не удалось опубликовать запрос', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!request) return;
    
    try {
      await requestsAPI.deleteRequest(request.id);
      await deleteRequest(request.id);
      notifyRequestUpdated(request.id);
      setShowDeleteDialog(false);
      
      toast({
        title: 'Успешно',
        description: 'Запрос удалён',
      });
      
      navigate('/zaprosy', { replace: true });
    } catch (error) {
      console.error('Error deleting request:', error);
      setShowDeleteDialog(false);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить запрос',
        variant: 'destructive',
      });
    }
  };

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
      
      <main className="container mx-auto px-4 py-8 flex-1 max-w-4xl">
        <EditRequestHeader />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Управление запросом</h1>
        </div>

        <EditRequestTabs
          request={request}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onDelete={handleDelete}
          onUpdate={setRequest}
          orders={responseOrders}
        />
      </main>

      <EditRequestDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
      />

      <AlertDialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Опубликовать запрос заново?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы можете отредактировать запрос прямо сейчас, а затем подтвердить публикацию. После публикации запрос снова станет виден всем поставщикам.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowPublishDialog(false)}>
              Сначала отредактирую
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish} disabled={isPublishing}>
              {isPublishing ? (
                <><Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />Публикуем...</>
              ) : 'Опубликовать'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}