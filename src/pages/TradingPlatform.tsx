import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { checkAccessPermission } from '@/utils/permissions';
import { getSession } from '@/utils/auth';
import ProductMediaGallery from '@/components/ProductMediaGallery';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface TradingPlatformProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Contract {
  id: number;
  contractType: string;
  title: string;
  description: string;
  category: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  deliveryDate: string;
  status: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerRating: number;
  discountPercent: number;
  financingAvailable: boolean;
  viewsCount: number;
  createdAt: string;
  productImages?: string[];
  productVideoUrl?: string;
}

export default function TradingPlatform({ isAuthenticated, onLogout }: TradingPlatformProps) {
  const navigate = useNavigate();
  useScrollToTop();
  const { toast } = useToast();
  const accessCheck = checkAccessPermission(isAuthenticated, 'contracts');

  useEffect(() => {
    if (!accessCheck.allowed) {
      navigate('/');
    }
  }, [accessCheck.allowed, navigate]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const currentUser = getSession();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadContracts();
  }, [isAuthenticated, navigate]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      const response = await fetch('https://functions.poehali.dev/f1e9dea3-13a0-488b-a042-58b89a19b204?status=open', {
        headers: {
          'X-User-Id': userId || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить контракты',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getContractTypeLabel = (type: string) => {
    return type === 'futures' ? 'Фьючерс' : 'Форвард';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      open: 'default',
      in_progress: 'secondary',
      completed: 'outline',
      cancelled: 'outline',
    };

    const labels: Record<string, string> = {
      open: 'Открыт',
      in_progress: 'В работе',
      completed: 'Завершен',
      cancelled: 'Отменен',
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = searchQuery === '' ||
      contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.productName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || contract.category === selectedCategory;
    const matchesType = selectedType === 'all' || contract.contractType === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  const handleCreateContract = () => {
    if (currentUser?.verificationStatus !== 'verified') {
      setShowVerificationDialog(true);
      return;
    }
    navigate('/create-contract');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Торговая площадка</h1>
                <p className="text-muted-foreground">
                  Фьючерсные и форвардные контракты для верифицированных участников
                </p>
              </div>
              {currentUser?.userType !== 'individual' && (
                <Button onClick={handleCreateContract} size="lg">
                  <Icon name="Plus" className="mr-2 h-4 w-4" />
                  Создать контракт
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Активных контрактов
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contracts.filter(c => c.status === 'open').length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    С финансированием
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contracts.filter(c => c.financingAvailable).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Со скидками
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {contracts.filter(c => c.discountPercent > 0).length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Общий объем
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(contracts.reduce((sum, c) => sum + c.totalAmount, 0))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Поиск по контрактам..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Тип контракта" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="futures">Фьючерсы</SelectItem>
                  <SelectItem value="forward">Форварды</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  <SelectItem value="agriculture">Сельское хозяйство</SelectItem>
                  <SelectItem value="food">Продукты питания</SelectItem>
                  <SelectItem value="materials">Стройматериалы</SelectItem>
                  <SelectItem value="services">Услуги</SelectItem>
                  <SelectItem value="other">Прочее</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Icon name="Package" className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Контракты не найдены</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContracts.map((contract) => (
                <Card key={contract.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/contract/${contract.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">
                        {getContractTypeLabel(contract.contractType)}
                      </Badge>
                      {getStatusBadge(contract.status)}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{contract.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {contract.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProductMediaGallery 
                      images={contract.productImages}
                      videoUrl={contract.productVideoUrl}
                      productName={contract.productName}
                    />
                    <div className="mt-3 border-t pt-3" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Icon name="Package" className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {contract.productName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Icon name="Scale" className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {contract.quantity} {contract.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Icon name="Calendar" className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Поставка: {formatDate(contract.deliveryDate)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <div className="text-xs text-muted-foreground">Цена за единицу</div>
                          <div className="font-semibold">{formatPrice(contract.pricePerUnit)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Общая сумма</div>
                          <div className="font-bold text-lg">{formatPrice(contract.totalAmount)}</div>
                        </div>
                      </div>

                      {(contract.discountPercent > 0 || contract.financingAvailable) && (
                        <div className="flex gap-2 pt-2">
                          {contract.discountPercent > 0 && (
                            <Badge variant="outline" className="text-green-600">
                              <Icon name="Tag" className="h-3 w-3 mr-1" />
                              Скидка {contract.discountPercent}%
                            </Badge>
                          )}
                          {contract.financingAvailable && (
                            <Badge variant="outline" className="text-blue-600">
                              <Icon name="DollarSign" className="h-3 w-3 mr-1" />
                              Финансирование
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Icon name="User" className="h-3 w-3" />
                          {contract.sellerFirstName} {contract.sellerLastName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name="Eye" className="h-3 w-3" />
                          {contract.viewsCount}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Требуется верификация</DialogTitle>
            <DialogDescription className="pt-4">
              Только верифицированные пользователи могут создавать контракты на торговой площадке.
              Пожалуйста, пройдите верификацию, чтобы получить доступ к этой функции.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowVerificationDialog(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                setShowVerificationDialog(false);
                navigate('/verification');
              }}
            >
              Пройти верификацию
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}