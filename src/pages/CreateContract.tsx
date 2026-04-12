import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useContractData } from '@/hooks/useContractData';
import ContractFormFields from '@/components/contract/ContractFormFields';

interface CreateContractProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function CreateContract({ isAuthenticated, onLogout }: CreateContractProps) {
  useScrollToTop();
  const navigate = useNavigate();

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
  } = useContractData(isAuthenticated);

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto space-y-6">

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Создание контракта</h1>
              <p className="text-sm text-muted-foreground">Заполните данные — документ сформируется автоматически по ГК РФ</p>
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
            onSave={handleSaveToContracts}
            onPublish={handlePublishContract}
            categoryManuallySet={categoryManuallySet}
            categoryBManuallySet={categoryBManuallySet}
          />

        </div>
      </main>

      <Footer />
    </div>
  );
}