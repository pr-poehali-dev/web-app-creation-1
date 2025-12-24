import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';

interface VerificationRejectionAlertProps {
  rejectionReason?: string;
}

export default function VerificationRejectionAlert({ 
  rejectionReason 
}: VerificationRejectionAlertProps) {
  if (!rejectionReason) return null;

  return (
    <Alert variant="destructive">
      <Icon name="AlertCircle" className="h-4 w-4" />
      <AlertDescription>
        <p className="font-semibold mb-1">Причина отклонения:</p>
        <p>{rejectionReason}</p>
      </AlertDescription>
    </Alert>
  );
}
