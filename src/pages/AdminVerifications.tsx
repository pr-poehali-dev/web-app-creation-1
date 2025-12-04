import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import VerificationCard from '@/components/admin/VerificationCard';
import ReviewDialog from '@/components/admin/ReviewDialog';
import DocumentsDialog from '@/components/admin/DocumentsDialog';

interface AdminVerificationsProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

interface Verification {
  id: number;
  userId: number;
  verificationType: string;
  status: string;
  phone: string;
  phoneVerified: boolean;
  registrationAddress: string | null;
  actualAddress: string | null;
  passportScanUrl: string | null;
  utilityBillUrl: string | null;
  registrationCertUrl: string | null;
  agreementFormUrl: string | null;
  companyName: string | null;
  inn: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
}

export default function AdminVerifications({ isAuthenticated, onLogout }: AdminVerificationsProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showDocumentsDialog, setShowDocumentsDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    const userRole = localStorage.getItem('userRole');
    
    if (!adminSession || userRole !== 'admin') {
      toast({
        title: 'Доступ запрещен',
        description: 'Требуется авторизация администратора',
        variant: 'destructive',
      });
      navigate('/admin');
      return;
    }
    
    loadVerifications('pending');
  }, [navigate, toast]);

  const loadVerifications = async (status: string) => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId');
      
      const response = await fetch(`https://functions.poehali.dev/bdff7262-3acc-4253-afcc-26ef5ef8b778?status=${status}`, {
        headers: {
          'X-User-Id': userId || '',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка загрузки заявок');
      }

      const data = await response.json();
      setVerifications(data.verifications || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить заявки',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    loadVerifications(value);
  };

  const handleReview = (verification: Verification, action: 'approve' | 'reject') => {
    setSelectedVerification(verification);
    setReviewAction(action);
    setRejectionReason('');
    setShowReviewDialog(true);
  };

  const handleViewDocuments = (verification: Verification) => {
    setSelectedVerification(verification);
    setShowDocumentsDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedVerification) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Укажите причину отклонения',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const userId = localStorage.getItem('userId');
      
      const response = await fetch('https://functions.poehali.dev/6054aed7-d9a1-4b6c-a98d-5a54e058be0b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
        },
        body: JSON.stringify({
          verificationId: selectedVerification.id,
          action: reviewAction,
          rejectionReason: rejectionReason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка при обработке заявки');
      }

      toast({
        title: 'Успешно',
        description: reviewAction === 'approve' 
          ? 'Заявка одобрена' 
          : 'Заявка отклонена',
      });

      setShowReviewDialog(false);
      loadVerifications(activeTab);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось обработать заявку',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVerificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      individual: 'Физическое лицо',
      self_employed: 'Самозанятый',
      legal_entity: 'Юридическое лицо',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={isAuthenticated} onLogout={onLogout} />

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                Назад
              </Button>
              <Button variant="outline" onClick={() => navigate('/admin/change-password')}>
                <Icon name="Key" className="mr-2 h-4 w-4" />
                Сменить пароль
              </Button>
            </div>
            <h1 className="text-3xl font-bold">Модерация верификации</h1>
            <p className="text-muted-foreground mt-2">
              Проверка и одобрение заявок на верификацию пользователей
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">На рассмотрении</TabsTrigger>
              <TabsTrigger value="approved">Одобренные</TabsTrigger>
              <TabsTrigger value="rejected">Отклоненные</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : verifications.length === 0 ? (
                <Alert>
                  <Icon name="Info" className="h-4 w-4" />
                  <AlertDescription>
                    Нет заявок с этим статусом
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {verifications.map((verification) => (
                    <VerificationCard
                      key={verification.id}
                      verification={verification}
                      activeTab={activeTab}
                      onReview={handleReview}
                      onViewDocuments={handleViewDocuments}
                      getVerificationTypeLabel={getVerificationTypeLabel}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        selectedVerification={selectedVerification}
        reviewAction={reviewAction}
        rejectionReason={rejectionReason}
        onRejectionReasonChange={setRejectionReason}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitReview}
      />

      <DocumentsDialog
        open={showDocumentsDialog}
        onOpenChange={setShowDocumentsDialog}
        selectedVerification={selectedVerification}
        getVerificationTypeLabel={getVerificationTypeLabel}
      />

      <Footer />
    </div>
  );
}
