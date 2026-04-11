import { useNavigate } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useContractData } from '@/hooks/useContractData';
import ContractFormFields from '@/components/contract/ContractFormFields';
import ContractPreview from '@/components/contract/ContractPreview';

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
    setImages,
    handleProductNameChange,
    handleProductNameBChange,
    totalAmount,
    prepaymentAmount,
    step,
    setStep,
    isCheckingVerification,
    isGenerating,
    isSubmitting,
    isPublishing,
    generatedDocx,
    contractHtml,
    handleGenerate,
    downloadPdf,
    downloadDocx,
    handleSaveToContracts,
    handlePublishContract,
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
            <Button variant="ghost" size="sm" onClick={() => step === 'preview' ? setStep('form') : navigate(-1)}>
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              {step === 'preview' ? 'К форме' : 'Назад'}
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Создание контракта</h1>
              <p className="text-sm text-muted-foreground">
                {step === 'form' ? 'Заполните данные — документ сформируется автоматически по ГК РФ' : 'Документ сформирован — скачайте и подпишите'}
              </p>
            </div>
          </div>

          {step === 'form' && (
            <ContractFormFields
              formData={formData}
              set={set}
              setImages={setImages}
              handleProductNameChange={handleProductNameChange}
              handleProductNameBChange={handleProductNameBChange}
              totalAmount={totalAmount}
              prepaymentAmount={prepaymentAmount}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
            />
          )}

          {step === 'preview' && contractHtml && (
            <ContractPreview
              formData={formData}
              totalAmount={totalAmount}
              generatedDocx={generatedDocx}
              isSubmitting={isSubmitting}
              isPublishing={isPublishing}
              onDownloadPdf={downloadPdf}
              onDownloadDocx={downloadDocx}
              onSave={handleSaveToContracts}
              onPublish={handlePublishContract}
              onEdit={() => setStep('form')}
            />
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}