import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { requestsAPI } from '@/services/api';
import { dataSync } from '@/utils/dataSync';
import AdminRequestsFilters from '@/components/admin-requests/AdminRequestsFilters';
import AdminRequestsTable, { type AdminRequest } from '@/components/admin-requests/AdminRequestsTable';
import AdminRequestsDeleteDialog from '@/components/admin-requests/AdminRequestsDeleteDialog';

interface AdminRequestsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminRequests({ isAuthenticated, onLogout }: AdminRequestsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterBuyer, setFilterBuyer] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [allRequests, setAllRequests] = useState<AdminRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [searchQuery, filterStatus]);
  
  useEffect(() => {
    const unsubscribe = dataSync.subscribe('request_updated', () => {
      console.log('Request updated, reloading admin requests...');
      fetchRequests();
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allRequests, filterBuyer]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;
      if (filterStatus !== 'all') params.status = filterStatus;

      const data = await requestsAPI.getAdminRequests(params);
      
      const mappedRequests: AdminRequest[] = (data.requests || []).map((req: Record<string, unknown>) => ({
        id: req.id as string,
        title: req.title as string,
        buyer: (req.buyer as string) || 'Неизвестно',
        buyerId: req.buyerId as string | undefined,
        pricePerUnit: (req.pricePerUnit || 0) as number,
        budget: (req.budget || 0) as number,
        quantity: (req.quantity || 0) as number,
        unit: (req.unit as string) || '',
        status: (req.status as AdminRequest['status']) || 'active',
        createdAt: req.createdAt as string
      }));
      
      setAllRequests(mappedRequests);
      setRequests(mappedRequests);
    } catch (error) {
      console.error('Ошибка загрузки запросов:', error);
      toast.error('Ошибка при загрузке запросов');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    if (filterBuyer === 'all') {
      setRequests(allRequests);
    } else {
      setRequests(allRequests.filter(req => req.buyerId === filterBuyer));
    }
  };

  const uniqueBuyers = Array.from(
    new Map(
      allRequests
        .filter(r => r.buyerId)
        .map(r => [r.buyerId, { id: r.buyerId!, name: r.buyer }])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  const handleApproveRequest = async (request: AdminRequest) => {
    try {
      await requestsAPI.adminApproveRequest(request.id);
      toast.success(`Запрос "${request.title}" одобрен`);
      fetchRequests();
    } catch {
      toast.error('Ошибка при одобрении запроса');
    }
  };

  const handleRejectRequest = async (request: AdminRequest) => {
    try {
      await requestsAPI.adminRejectRequest(request.id);
      toast.success(`Запрос "${request.title}" отклонен`);
      fetchRequests();
    } catch {
      toast.error('Ошибка при отклонении запроса');
    }
  };

  const handleEditTitle = (request: AdminRequest) => {
    setEditingTitleId(request.id);
    setEditingTitleValue(request.title);
  };

  const handleSaveTitle = async (requestId: string) => {
    const trimmed = editingTitleValue.trim();
    if (!trimmed) return;
    try {
      await requestsAPI.adminEditTitle(requestId, trimmed);
      toast.success('Название обновлено');
      setEditingTitleId(null);
      fetchRequests();
    } catch {
      toast.error('Не удалось сохранить название');
    }
  };

  const handleCancelEditTitle = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleDeleteRequest = async () => {
    if (selectedRequest) {
      try {
        await requestsAPI.deleteAdminRequest(selectedRequest.id);
        toast.success(`Запрос "${selectedRequest.title}" удален`);
        setShowDeleteDialog(false);
        setSelectedRequest(null);
        fetchRequests();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Ошибка при удалении запроса');
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад
              </Button>
              <h1 className="text-3xl font-bold">Управление запросами</h1>
              <p className="text-muted-foreground">Модерация и управление запросами</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список запросов</CardTitle>
              <CardDescription>Всего запросов: {requests.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminRequestsFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                filterBuyer={filterBuyer}
                onFilterBuyerChange={setFilterBuyer}
                uniqueBuyers={uniqueBuyers}
              />

              <AdminRequestsTable
                requests={requests}
                isLoading={isLoading}
                editingTitleId={editingTitleId}
                editingTitleValue={editingTitleValue}
                onEditingTitleValueChange={setEditingTitleValue}
                onEditTitle={handleEditTitle}
                onSaveTitle={handleSaveTitle}
                onCancelEditTitle={handleCancelEditTitle}
                onApprove={handleApproveRequest}
                onReject={handleRejectRequest}
                onDelete={(request) => {
                  setSelectedRequest(request);
                  setShowDeleteDialog(true);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </main>

      <AdminRequestsDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteRequest}
        requestTitle={selectedRequest?.title}
      />

      <Footer />
    </div>
  );
}
