import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Request } from '@/types/offer';
import { requestsAPI } from '@/services/api';
import { getSession } from '@/utils/auth';
import { useToast } from '@/hooks/use-toast';
import { useOffers } from '@/contexts/OffersContext';
import EditRequestHeader from '@/components/edit-request/EditRequestHeader';
import EditRequestTabs from '@/components/edit-request/EditRequestTabs';
import EditRequestDeleteDialog from '@/components/edit-request/EditRequestDeleteDialog';

interface EditRequestProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function EditRequest({ isAuthenticated, onLogout }: EditRequestProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const currentUser = getSession();
  
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!request) return;
    
    deleteRequest(request.id);
    setShowDeleteDialog(false);
    
    localStorage.setItem('requests_updated', 'true');
    
    toast({
      title: 'Успешно',
      description: 'Запрос удалён',
    });
    
    navigate('/zaprosy', { replace: true });
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
        />
      </main>

      <EditRequestDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
      />

      <Footer />
    </div>
  );
}
