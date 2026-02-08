import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { checkAccessPermission } from '@/utils/permissions';
import { getSession } from '@/utils/auth';
import { dataSync } from '@/utils/dataSync';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import TradingPlatformStats from '@/components/trading/TradingPlatformStats';
import TradingPlatformFilters from '@/components/trading/TradingPlatformFilters';
import ContractCard from '@/components/trading/ContractCard';

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
    
    const unsubscribe = dataSync.subscribe('contract_updated', () => {
      console.log('Contract updated, reloading contracts...');
      loadContracts();
    });
    
    return () => {
      unsubscribe();
    };
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
    if (currentUser?.verificationStatus === 'pending') {
      toast({
        title: 'Верификация на рассмотрении',
        description: 'Верификация вашей учётной записи на рассмотрении. После одобрения верификации или отказа вы получите соответствующее уведомление. После успешной верификации вам будут доступны все возможности на ЕРТТП.',
        duration: 8000,
      });
      return;
    }
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

            <TradingPlatformStats contracts={contracts} formatPrice={formatPrice} />

            <TradingPlatformFilters
              searchQuery={searchQuery}
              selectedType={selectedType}
              selectedCategory={selectedCategory}
              onSearchChange={setSearchQuery}
              onTypeChange={setSelectedType}
              onCategoryChange={setSelectedCategory}
            />
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
                <ContractCard
                  key={contract.id}
                  contract={contract}
                  onCardClick={(id) => navigate(`/contract/${id}`)}
                  getContractTypeLabel={getContractTypeLabel}
                  getStatusBadge={getStatusBadge}
                  formatDate={formatDate}
                  formatPrice={formatPrice}
                />
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
            <DialogDescription>
              Для создания контрактов необходимо пройти верификацию. Это позволяет подтвердить
              вашу надежность как участника торговой площадки.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowVerificationDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => navigate('/profile')}>
              Перейти к верификации
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}