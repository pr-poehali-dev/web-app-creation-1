import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

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
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadVerifications('pending');
  }, [isAuthenticated, navigate]);

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
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
              <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
              Назад
            </Button>
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
                    <Card key={verification.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {verification.userLastName} {verification.userFirstName}
                            </CardTitle>
                            <CardDescription>
                              {verification.userEmail} • {getVerificationTypeLabel(verification.verificationType)}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary">
                            {formatDate(verification.createdAt)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Телефон</Label>
                              <p className="text-sm text-muted-foreground">{verification.phone}</p>
                            </div>

                            {verification.verificationType === 'legal_entity' ? (
                              <>
                                <div>
                                  <Label className="text-sm font-medium">Название компании</Label>
                                  <p className="text-sm text-muted-foreground">{verification.companyName}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">ИНН</Label>
                                  <p className="text-sm text-muted-foreground">{verification.inn}</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <Label className="text-sm font-medium">Адрес регистрации</Label>
                                  <p className="text-sm text-muted-foreground">{verification.registrationAddress}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Фактический адрес</Label>
                                  <p className="text-sm text-muted-foreground">{verification.actualAddress}</p>
                                </div>
                              </>
                            )}
                          </div>

                          <div>
                            <Label className="text-sm font-medium mb-2 block">Документы</Label>
                            <div className="flex flex-wrap gap-2">
                              {verification.passportScanUrl && (
                                <Badge variant="outline">
                                  <Icon name="FileText" className="h-3 w-3 mr-1" />
                                  Паспорт
                                </Badge>
                              )}
                              {verification.utilityBillUrl && (
                                <Badge variant="outline">
                                  <Icon name="FileText" className="h-3 w-3 mr-1" />
                                  Квитанция
                                </Badge>
                              )}
                              {verification.registrationCertUrl && (
                                <Badge variant="outline">
                                  <Icon name="FileText" className="h-3 w-3 mr-1" />
                                  Свидетельство
                                </Badge>
                              )}
                              {verification.agreementFormUrl && (
                                <Badge variant="outline">
                                  <Icon name="FileText" className="h-3 w-3 mr-1" />
                                  Соглашение
                                </Badge>
                              )}
                            </div>
                          </div>

                          {verification.rejectionReason && (
                            <Alert variant="destructive">
                              <Icon name="AlertCircle" className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Причина отклонения:</strong> {verification.rejectionReason}
                              </AlertDescription>
                            </Alert>
                          )}

                          {activeTab === 'pending' && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                onClick={() => handleReview(verification, 'approve')}
                                className="flex-1"
                              >
                                <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                                Одобрить
                              </Button>
                              <Button
                                onClick={() => handleReview(verification, 'reject')}
                                variant="destructive"
                                className="flex-1"
                              >
                                <Icon name="XCircle" className="mr-2 h-4 w-4" />
                                Отклонить
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Одобрить заявку' : 'Отклонить заявку'}
            </DialogTitle>
            <DialogDescription>
              {selectedVerification && (
                <>
                  Пользователь: {selectedVerification.userLastName} {selectedVerification.userFirstName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {reviewAction === 'reject' && (
            <div>
              <Label htmlFor="rejectionReason">Причина отклонения *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Укажите причину отклонения заявки"
                rows={4}
                required
              />
            </div>
          )}

          {reviewAction === 'approve' && (
            <Alert>
              <Icon name="Info" className="h-4 w-4" />
              <AlertDescription>
                После одобрения пользователь получит доступ к созданию запросов и предложений.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSubmitting}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {isSubmitting ? (
                <>
                  <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  {reviewAction === 'approve' ? 'Одобрить' : 'Отклонить'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
