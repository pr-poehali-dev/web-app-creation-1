import { useState } from 'react';
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

interface AdminRequestsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Request {
  id: string;
  title: string;
  buyer: string;
  budget: number;
  status: 'active' | 'moderation' | 'rejected' | 'completed';
  createdAt: string;
}

export default function AdminRequests({ isAuthenticated, onLogout }: AdminRequestsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const mockRequests: Request[] = [
    {
      id: '1',
      title: 'Нужен цемент М500',
      buyer: 'ООО "СтройКомплект"',
      budget: 100000,
      status: 'active',
      createdAt: '2024-01-18'
    },
    {
      id: '2',
      title: 'Требуется щебень фракции 5-20',
      buyer: 'ИП Сидоров',
      budget: 50000,
      status: 'moderation',
      createdAt: '2024-02-12'
    },
  ];

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
      default:
        return null;
    }
  };

  const handleApproveRequest = (request: Request) => {
    toast.success(`Запрос "${request.title}" одобрен`);
  };

  const handleRejectRequest = (request: Request) => {
    toast.success(`Запрос "${request.title}" отклонен`);
  };

  const handleDeleteRequest = () => {
    if (selectedRequest) {
      toast.success(`Запрос "${selectedRequest.title}" удален`);
      setShowDeleteDialog(false);
      setSelectedRequest(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')} className="mb-2">
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад к панели
              </Button>
              <h1 className="text-3xl font-bold">Управление запросами</h1>
              <p className="text-muted-foreground">Модерация и управление запросами</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список запросов</CardTitle>
              <CardDescription>Всего запросов: {mockRequests.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
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
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Покупатель</TableHead>
                      <TableHead>Бюджет</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата создания</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">{request.title}</TableCell>
                        <TableCell>{request.buyer}</TableCell>
                        <TableCell>{request.budget.toLocaleString('ru-RU')} ₽</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{new Date(request.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
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
