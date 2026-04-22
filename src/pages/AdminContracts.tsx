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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import func2url from '../../backend/func2url.json';

interface AdminContractsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Contract {
  id: number;
  title: string;
  contractType: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerCompanyName?: string;
  buyerFirstName?: string;
  buyerLastName?: string;
  buyerCompanyName?: string;
  totalAmount: number;
  currency: string;
  status: string;
  deliveryDate: string;
  createdAt: string;
}

export default function AdminContracts({ isAuthenticated, onLogout }: AdminContractsProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const CONTRACTS_API = (func2url as Record<string, string>)['contracts-list'];

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${CONTRACTS_API}?limit=200&offset=0`);
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts || []);
      }
    } catch {
      toast.error('Ошибка загрузки контрактов');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-green-500">Открыт</Badge>;
      case 'draft': return <Badge variant="outline">Черновик</Badge>;
      case 'in_progress': return <Badge className="bg-blue-500">В работе</Badge>;
      case 'signed': return <Badge className="bg-purple-500">Подписан</Badge>;
      case 'completed': return <Badge>Завершен</Badge>;
      case 'cancelled': return <Badge variant="destructive">Отменен</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'forward': return <Badge variant="outline" className="bg-orange-50">Форвард</Badge>;
      case 'barter': return <Badge variant="outline" className="bg-purple-50">Бартер</Badge>;
      case 'forward-request': return <Badge variant="outline" className="bg-blue-50">Запрос</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatSeller = (c: Contract) =>
    c.sellerCompanyName || `${c.sellerFirstName} ${c.sellerLastName}`.trim() || '—';

  const formatBuyer = (c: Contract) => {
    if (!c.buyerFirstName && !c.buyerLastName && !c.buyerCompanyName) return null;
    return c.buyerCompanyName || `${c.buyerFirstName || ''} ${c.buyerLastName || ''}`.trim() || null;
  };

  const formatDate = (d: string) => {
    if (!d || d === 'None') return '—';
    try { return new Date(d).toLocaleDateString('ru-RU'); } catch { return d; }
  };

  const filteredContracts = contracts.filter(c => {
    const seller = formatSeller(c).toLowerCase();
    const buyer = (formatBuyer(c) || '').toLowerCase();
    const matchesSearch = !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.includes(searchQuery.toLowerCase()) ||
      buyer.includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesType = filterType === 'all' || c.contractType === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

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
              <p className="text-muted-foreground">Просмотр и модерация форвардных контрактов</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список контрактов</CardTitle>
              <CardDescription>Всего контрактов: {filteredContracts.length}</CardDescription>
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
                    <SelectItem value="forward">Форварды</SelectItem>
                    <SelectItem value="barter">Бартер</SelectItem>
                    <SelectItem value="forward-request">Запросы</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="open">Открытые</SelectItem>
                    <SelectItem value="draft">Черновики</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="signed">Подписаны</SelectItem>
                    <SelectItem value="completed">Завершенные</SelectItem>
                    <SelectItem value="cancelled">Отмененные</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-muted-foreground">Загрузка...</div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Название</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Продавец / Инициатор</TableHead>
                        <TableHead>Покупатель</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Дата поставки</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredContracts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Контракты не найдены
                          </TableCell>
                        </TableRow>
                      ) : filteredContracts.map((contract) => (
                        <TableRow key={contract.id}>
                          <TableCell className="font-medium">{contract.title}</TableCell>
                          <TableCell>{getTypeBadge(contract.contractType)}</TableCell>
                          <TableCell>{formatSeller(contract)}</TableCell>
                          <TableCell>
                            {formatBuyer(contract) || <span className="text-muted-foreground">Не назначен</span>}
                          </TableCell>
                          <TableCell className="font-bold">
                            {contract.contractType === 'barter' ? 'Бартер' : (contract.totalAmount > 0 ? `${Number(contract.totalAmount).toLocaleString('ru-RU')} ₽` : '—')}
                          </TableCell>
                          <TableCell>{getStatusBadge(contract.status)}</TableCell>
                          <TableCell>{formatDate(contract.deliveryDate)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/contract/${contract.id}`)}
                            >
                              <Icon name="Eye" className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
