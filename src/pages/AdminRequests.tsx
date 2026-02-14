import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { requestsAPI } from '@/services/api';
import { dataSync } from '@/utils/dataSync';

interface AdminRequestsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface AdminRequest {
  id: string;
  title: string;
  buyer: string;
  buyerId?: string;
  pricePerUnit: number;
  budget: number;
  quantity: number;
  unit: string;
  status: 'active' | 'moderation' | 'rejected' | 'completed' | 'archived' | 'deleted';
  createdAt: string;
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
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (filterStatus !== 'all') params.status = filterStatus;

      const data = await requestsAPI.getAdminRequests(params);
      
      const mappedRequests: AdminRequest[] = (data.requests || []).map((req: any) => ({
        id: req.id,
        title: req.title,
        buyer: req.buyer || 'Неизвестно',
        buyerId: req.buyerId,
        pricePerUnit: req.pricePerUnit || 0,
        budget: req.budget || 0,
        quantity: req.quantity || 0,
        unit: req.unit || '',
        status: req.status || 'active',
        createdAt: req.createdAt
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Активно</Badge>;
      case 'moderation':
        return <Badge variant="secondary">На модерации</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонено</Badge>;
      case 'completed':
        return <Badge>Завершено</Badge>;
      case 'archived':
        return <Badge variant="outline">Архив</Badge>;
      case 'deleted':
        return <Badge variant="outline" className="bg-gray-100">Удалено</Badge>;
      default:
        return null;
    }
  };

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
              <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Поиск по названию или покупателю..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="active">Активные</SelectItem>
                      <SelectItem value="moderation">На модерации</SelectItem>
                      <SelectItem value="rejected">Отклоненные</SelectItem>
                      <SelectItem value="completed">Завершенные</SelectItem>
                      <SelectItem value="archived">Архивированные</SelectItem>
                      <SelectItem value="deleted">Удаленные</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterBuyer} onValueChange={setFilterBuyer}>
                    <SelectTrigger className="w-full md:w-[250px]">
                      <SelectValue placeholder="Покупатель" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все покупатели</SelectItem>
                      {uniqueBuyers.map(buyer => (
                        <SelectItem key={buyer.id} value={buyer.id}>
                          {buyer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Покупатель</TableHead>
                      <TableHead>Цена за ед.</TableHead>
                      <TableHead>Бюджет</TableHead>
                      <TableHead>Количество</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Загрузка...
                        </TableCell>
                      </TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Запросы не найдены
                        </TableCell>
                      </TableRow>
                    ) : requests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {editingTitleId === request.id ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editingTitleValue}
                                onChange={(e) => setEditingTitleValue(e.target.value)}
                                className="h-8 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveTitle(request.id);
                                  if (e.key === 'Escape') handleCancelEditTitle();
                                }}
                                autoFocus
                              />
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleSaveTitle(request.id)}>
                                <Icon name="Check" className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleCancelEditTitle}>
                                <Icon name="X" className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <span
                              className="cursor-pointer hover:text-primary"
                              onDoubleClick={() => handleEditTitle(request)}
                              title="Двойной клик для редактирования"
                            >
                              {request.title}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {request.buyerId ? (
                            <button
                              onClick={() => navigate(`/profile?userId=${request.buyerId}`)}
                              className="text-primary hover:underline"
                            >
                              {request.buyer}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">{request.buyer}</span>
                          )}
                        </TableCell>
                        <TableCell>{request.pricePerUnit.toLocaleString('ru-RU')} ₽</TableCell>
                        <TableCell className="font-semibold">{request.budget.toLocaleString('ru-RU')} ₽</TableCell>
                        <TableCell>{request.quantity} {request.unit}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditTitle(request)}
                              title="Редактировать название"
                            >
                              <Icon name="Pencil" className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/request/${request.id}`)}
                            >
                              <Icon name="Eye" className="h-4 w-4" />
                            </Button>
                            {request.status === 'moderation' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleApproveRequest(request)}
                                >
                                  <Icon name="Check" className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectRequest(request)}
                                >
                                  <Icon name="X" className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Icon name="Trash2" className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить запрос?</DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить запрос "{selectedRequest?.title}"? 
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteRequest}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}