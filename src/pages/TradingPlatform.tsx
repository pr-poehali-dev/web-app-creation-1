import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

import { getSession, saveSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';

import ContractCard from '@/components/trading/ContractCard';
import PullToRefresh from '@/components/PullToRefresh';
import TradingPlatformHeader from '@/components/trading/TradingPlatformHeader';
import TradingVerificationDialog from '@/components/trading/TradingVerificationDialog';
import ForwardInfoDialog from '@/components/trading/ForwardInfoDialog';
import BarterInfoDialog from '@/components/trading/BarterInfoDialog';

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
  sellerCompanyName?: string;
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

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showForwardInfo, setShowForwardInfo] = useState(false);
  const [showBarterInfo, setShowBarterInfo] = useState(false);
  const [currentUser, setCurrentUser] = useState(getSession());

  const loadContracts = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      const response = await fetch(`${func2url['contracts-list']}?status=open`, {
        headers: { 'X-User-Id': userId || '' },
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadContracts();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      forward: 'Форвардные предложения',
      'forward-request': 'Форвардные запросы',
      barter: 'Бартер',
    };
    return labels[type] || 'Контракт';
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

  const handleCreateContract = async () => {
    let verificationStatus = currentUser?.verificationStatus;

    const userId = localStorage.getItem('userId');
    if (userId) {
      try {
        const res = await fetch(func2url['verification-status'], {
          headers: { 'X-User-Id': userId },
        });
        const data = await res.json();
        const status = data.verificationStatus || data.verification_status;
        if (status) {
          verificationStatus = status;
          const updated = { ...getSession(), verificationStatus };
          saveSession(updated);
          setCurrentUser(updated);
        }
        const userType = data.userType;
        const restrictedTypes = ['individual', 'self-employed'];
        if (verificationStatus === 'verified' && userType && restrictedTypes.includes(userType)) {
          toast({
            title: 'Создание контрактов недоступно',
            description: 'Создавать форвардные и бартерные контракты могут только ИП и юридические лица. Вы можете принимать предложения по контрактам.',
            duration: 8000,
          });
          return;
        }
      } catch { /* network unavailable, use cached status */ }
    }

    if (verificationStatus === 'pending') {
      toast({
        title: 'Верификация на рассмотрении',
        description: 'Верификация вашей учётной записи на рассмотрении. После одобрения верификации или отказа вы получите соответствующее уведомление. После успешной верификации вам будут доступны все возможности на ЕРТТП.',
        duration: 8000,
      });
      return;
    }
    if (verificationStatus !== 'verified') {
      setShowVerificationDialog(true);
      return;
    }
    navigate('/create-contract');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <PullToRefresh onRefresh={loadContracts}>
      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <div className="max-w-7xl mx-auto">
          <TradingPlatformHeader
            selectedType={selectedType}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            onSearchChange={setSearchQuery}
            onTypeChange={setSelectedType}
            onCategoryChange={setSelectedCategory}
            onShowBarterInfo={() => setShowBarterInfo(true)}
            onShowForwardInfo={() => setShowForwardInfo(true)}
            onCreateContract={handleCreateContract}
          />

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
      </PullToRefresh>

      <Footer />

      <TradingVerificationDialog
        open={showVerificationDialog}
        onOpenChange={setShowVerificationDialog}
      />

      <ForwardInfoDialog
        open={showForwardInfo}
        onOpenChange={setShowForwardInfo}
      />

      <BarterInfoDialog
        open={showBarterInfo}
        onOpenChange={setShowBarterInfo}
      />
    </div>
  );
}