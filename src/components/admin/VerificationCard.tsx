import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

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

interface VerificationCardProps {
  verification: Verification;
  activeTab: string;
  onReview: (verification: Verification, action: 'approve' | 'reject') => void;
  onViewDocuments: (verification: Verification) => void;
  getVerificationTypeLabel: (type: string) => string;
  formatDate: (dateString: string) => string;
}

export default function VerificationCard({ 
  verification, 
  activeTab, 
  onReview, 
  onViewDocuments,
  getVerificationTypeLabel,
  formatDate 
}: VerificationCardProps) {
  return (
    <Card>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDocuments(verification)}
            >
              <Icon name="FileText" className="h-4 w-4 mr-2" />
              Просмотреть документы
            </Button>
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
                onClick={() => onReview(verification, 'approve')}
                className="flex-1"
              >
                <Icon name="CheckCircle" className="mr-2 h-4 w-4" />
                Одобрить
              </Button>
              <Button
                onClick={() => onReview(verification, 'reject')}
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
  );
}
