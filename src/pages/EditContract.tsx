import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useContractData } from '@/hooks/useContractData';
import ContractFormFields from '@/components/contract/ContractFormFields';
import { useToast } from '@/hooks/use-toast';
import { getSession } from '@/utils/auth';
import func2url from '../../backend/func2url.json';

interface EditContractProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function EditContract({ isAuthenticated, onLogout }: EditContractProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const session = getSession();

  const {
    formData,
    set,
    setArray,
    setImages,
    handleProductNameChange,
    handleProductNameBChange,
    totalAmount,
    prepaymentAmount,
    isCheckingVerification,
    isGenerating,
    isSubmitting,
    isPublishing,
    handleSaveToContracts,
    handlePublishContract,
    categoryManuallySet,
    categoryBManuallySet,
    prefillFormData,
    setIsCheckingVerification,
  } = useContractData(isAuthenticated, true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    loadContract();
  }, [id, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadContract = async () => {
    try {
      const rawId = (session as { id?: number })?.id ?? Number(localStorage.getItem('userId') || '0');
      const userId = String(rawId || '');
      const res = await fetch(`${(func2url as Record<string, string>)['contracts-list']}?id=${id}`, {
        headers: { 'X-User-Id': userId },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const c = (data.contracts || []).find((x: { id: number }) => x.id === Number(id));
      if (!c) {
        toast({ title: 'Контракт не найден', variant: 'destructive' });
        navigate(-1);
        return;
      }
      if (Number(c.sellerId) !== Number(rawId)) {
        toast({ title: 'Нет доступа', variant: 'destructive' });
        navigate(-1);
        return;
      }
      prefillFormData(c);
    } catch {
      toast({ title: 'Ошибка загрузки', variant: 'destructive' });
      navigate(-1);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  const contractId = Number(id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/contract/${id}`)}>
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Редактирование контракта</h1>
              <p className="text-sm text-muted-foreground">Вносите изменения и сохраняйте</p>
            </div>
          </div>

          <ContractFormFields
            formData={formData}
            set={set}
            setArray={setArray}
            setImages={setImages}
            handleProductNameChange={handleProductNameChange}
            handleProductNameBChange={handleProductNameBChange}
            totalAmount={totalAmount}
            prepaymentAmount={prepaymentAmount}
            isGenerating={isGenerating}
            isSubmitting={isSubmitting}
            isPublishing={isPublishing}
            onSave={() => handleSaveToContracts(contractId)}
            onPublish={() => handlePublishContract(contractId)}
            categoryManuallySet={categoryManuallySet}
            categoryBManuallySet={categoryBManuallySet}
          />

        </div>
      </main>

      <Footer />
    </div>
  );
}