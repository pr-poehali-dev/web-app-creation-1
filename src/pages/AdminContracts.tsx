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

interface AdminContractsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Contract {
  id: string;
  title: string;
  contractType: 'futures' | 'forward';
  seller: string;
  buyer: string | null;
  amount: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  deliveryDate: string;
  createdAt: string;
}

export default function AdminContracts({ isAuthenticated, onLogout }: AdminContractsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const mockContracts: Contract[] = [
    {
      id: '1',
      title: 'Фьючерс на цемент М500',
      contractType: 'futures',
      seller: 'ООО "СтройМатериалы"',
      buyer: 'ПАО "ГорСтрой"',
      amount: 2500000,
      status: 'in_progress',
      deliveryDate: '2025-03-15',
      createdAt: '2024-12-01'
    },
    {
      id: '2',
      title: 'Форвардный контракт на арматуру',
      contractType: 'forward',
      seller: 'ИП Петров',
      buyer: null,
      amount: 1800000,
      status: 'open',
      deliveryDate: '2025-02-20',
      createdAt: '2024-11-25'
    },
    {
      id: '3',
      title: 'Фьючерс на щебень фракции 5-20',
      contractType: 'futures',
      seller: 'ООО "КаменьСнаб"',
      buyer: 'ООО "СтройКомплект"',
      amount: 950000,
      status: 'completed',
      deliveryDate: '2024-12-10',
      createdAt: '2024-11-10'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500">Открыт</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">В работе</Badge>;
      case 'completed':
        return <Badge>Завершен</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Отменен</Badge>;
      default:
        return null;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === 'futures' ? (
      <Badge variant="outline" className="bg-purple-50">Фьючерс</Badge>
    ) : (
      <Badge variant="outline" className="bg-orange-50">Форвард</Badge>
    );
  };

  const handleCancelContract = (contract: Contract) => {
    toast.success(`Контракт "${contract.title}" отменен`);
  };

  const handleDeleteContract = () => {
    if (selectedContract) {
      toast.success(`Контракт "${selectedContract.title}" удален`);
      setShowDeleteDialog(false);
      setSelectedContract(null);
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
              <h1 className="text-3xl font-bold">Управление контрактами</h1>
              <p className="text-muted-foreground">Просмотр и модерация фьючерсов и форвардов</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список контрактов</CardTitle>
              <CardDescription>Всего контрактов: {mockContracts.length}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Поиск по названию или участникам..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="futures">Фьючерсы</SelectItem>
                    <SelectItem value="forward">Форварды</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="open">Открытые</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="completed">Завершенные</SelectItem>
                    <SelectItem value="cancelled">Отмененные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Продавец</TableHead>
                      <TableHead>Покупатель</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата поставки</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockContracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell className="font-medium">{contract.title}</TableCell>
                        <TableCell>{getTypeBadge(contract.contractType)}</TableCell>
                        <TableCell>{contract.seller}</TableCell>
                        <TableCell>{contract.buyer || <span className="text-muted-foreground">Не назначен</span>}</TableCell>
                        <TableCell className="font-bold">{contract.amount.toLocaleString('ru-RU')} ₽</TableCell>
                        <TableCell>{getStatusBadge(contract.status)}</TableCell>
                        <TableCell>{new Date(contract.deliveryDate).toLocaleDateString('ru-RU')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Icon name="Eye" className="h-4 w-4" />
                            </Button>
                            {(contract.status === 'open' || contract.status === 'in_progress') && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancelContract(contract)}
                              >
                                <Icon name="Ban" className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedContract(contract);
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
            <DialogTitle>Удалить контракт?</DialogTitle>
            <DialogDescription>
              Вы действительно хотите удалить контракт "{selectedContract?.title}"? 
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteContract}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Детали контракта</DialogTitle>
            <DialogDescription>
              Подробная информация о контракте
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Название</p>
                  <p className="font-medium">{selectedContract.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Тип контракта</p>
                  <div className="mt-1">{getTypeBadge(selectedContract.contractType)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Продавец</p>
                  <p className="font-medium">{selectedContract.seller}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Покупатель</p>
                  <p className="font-medium">{selectedContract.buyer || 'Не назначен'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Сумма контракта</p>
                  <p className="text-lg font-bold">{selectedContract.amount.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Статус</p>
                  <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата поставки</p>
                  <p className="font-medium">{new Date(selectedContract.deliveryDate).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Дата создания</p>
                  <p className="font-medium">{new Date(selectedContract.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}