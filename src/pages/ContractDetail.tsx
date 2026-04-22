import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackButton from '@/components/BackButton';
import { getSession } from '@/utils/auth';

import { useContractDetail } from './contract-detail/useContractDetail';
import ContractDetailHeader from './contract-detail/ContractDetailHeader';
import ContractDetailBody from './contract-detail/ContractDetailBody';
import ContractDetailDialogs from './contract-detail/ContractDetailDialogs';

interface ContractDetailProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function ContractDetail({ isAuthenticated, onLogout }: ContractDetailProps) {
  useScrollToTop();
  const { id } = useParams<{ id: string }>();
  const session = getSession();

  const {
    contract,
    loading,
    activeTab, setActiveTab,
    respondOpen, setRespondOpen,
    respondComment, setRespondComment,
    respondPrice, setRespondPrice,
    isSubmitting,
    alreadyResponded,
    negotiationOpen, setNegotiationOpen,
    negotiationResponseId,
    responses,
    showGuestDialog, setShowGuestDialog,
    respondVerifDialog, setRespondVerifDialog,
    loadContract,
    loadResponses,
    checkMyResponse,
    handleRespond,
    handleSubmitRespond,
    handleDeleteContract,
  } = useContractDetail(id);

  useEffect(() => {
    loadContract();
  }, [id, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatDate = (d: string) => {
    if (!d || d === 'None' || d === 'null') return '—';
    try {
      const dt = new Date(d);
      const y = dt.getFullYear();
      if (y <= 2000 || y >= 2099) return '—';
      return dt.toLocaleDateString('ru-RU');
    } catch { return '—'; }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(p || 0);

  if (loading) {
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

  if (!contract) return null;

  const currentUserId = Number(session?.id ?? localStorage.getItem('userId') ?? 0);
  const storedUserId = localStorage.getItem('userId') || '';
  const isSeller = (currentUserId > 0 && currentUserId === Number(contract.sellerId)) ||
                   (storedUserId !== '' && String(storedUserId) === String(contract.sellerId));
  const isBarter = contract.contractType === 'barter';
  const canDelete = isSeller && ['draft', 'open'].includes(contract.status);

  const handleNegotiate = async () => {
    let rid = negotiationResponseId.current;
    if (!rid) {
      const userId = localStorage.getItem('userId');
      if (userId) rid = await checkMyResponse(Number(id), userId);
    }
    if (rid) {
      negotiationResponseId.current = rid;
      setNegotiationOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <BackButton />
        <div className="max-w-3xl mx-auto space-y-6">

          <ContractDetailHeader
            contract={contract}
            isSeller={isSeller}
            isBarter={isBarter}
            canDelete={canDelete}
            isAuthenticated={isAuthenticated}
            alreadyResponded={alreadyResponded}
            onDelete={() => handleDeleteContract(contract)}
            onRespond={() => handleRespond(contract)}
            onNegotiate={handleNegotiate}
            onGuestRespond={() => setShowGuestDialog(true)}
          />

          <ContractDetailBody
            contract={contract}
            isBarter={isBarter}
            isSeller={isSeller}
            isAuthenticated={isAuthenticated}
            alreadyResponded={alreadyResponded}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            responses={responses}
            onRefreshResponses={() => {
              const userId = localStorage.getItem('userId');
              if (userId && contract.sellerId === Number(userId)) {
                loadResponses(contract.id, userId);
              }
            }}
            formatDate={formatDate}
            formatPrice={formatPrice}
            onGuestRespond={() => setShowGuestDialog(true)}
            onRespond={() => handleRespond(contract)}
            onNegotiate={handleNegotiate}
          />

        </div>
      </main>

      <Footer />

      <ContractDetailDialogs
        contract={contract}
        isBarter={isBarter}
        respondOpen={respondOpen}
        onRespondOpenChange={setRespondOpen}
        respondPrice={respondPrice}
        onRespondPriceChange={setRespondPrice}
        respondComment={respondComment}
        onRespondCommentChange={setRespondComment}
        isSubmitting={isSubmitting}
        onSubmitRespond={() => handleSubmitRespond(contract)}
        formatPrice={formatPrice}
        showGuestDialog={showGuestDialog}
        onGuestDialogChange={setShowGuestDialog}
        respondVerifDialog={respondVerifDialog}
        onRespondVerifDialogChange={(open) => setRespondVerifDialog((prev) => ({ ...prev, open }))}
        negotiationOpen={negotiationOpen}
        negotiationResponseId={negotiationResponseId.current}
        onNegotiationClose={() => setNegotiationOpen(false)}
        onStatusChange={loadContract}
      />
    </div>
  );
}
