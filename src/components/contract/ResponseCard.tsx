import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Contract, formatAmount } from './ContractCard';

const RESPONSE_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Заключён',
  cancelled: 'Отменён',
  rejected: 'Отклонён',
};

const RESPONSE_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  cancelled: 'destructive',
  rejected: 'destructive',
};

interface ResponseCardProps {
  contract: Contract;
  onClick: () => void;
  onNegotiate?: () => void;
}

export default function ResponseCard({ contract: c, onClick, onNegotiate }: ResponseCardProps) {
  const sellerName = `${c.sellerFirstName || ''} ${c.sellerLastName || ''}`.trim() || 'Продавец';
  const myName = `${c.respondentFirstName || ''} ${c.respondentLastName || ''}`.trim();
  const rStatus = c.myResponseStatus || 'pending';
  const isConfirmed = rStatus === 'confirmed';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div
          className="flex items-start justify-between gap-3 cursor-pointer"
          onClick={onClick}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm truncate">{c.title || c.productName || `Контракт #${c.id}`}</span>
              <Badge variant={RESPONSE_STATUS_VARIANTS[rStatus] ?? 'outline'} className="text-xs shrink-0">
                {RESPONSE_STATUS_LABELS[rStatus] ?? rStatus}
              </Badge>
              {isConfirmed && (
                <Badge className="text-xs shrink-0 bg-green-100 text-green-700 border-green-200">
                  <Icon name="ShieldCheck" size={10} className="mr-1" />
                  Согласован
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {myName && (
                <span className="flex items-center gap-1">
                  <Icon name="User" size={12} />
                  {myName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Icon name="Store" size={12} />
                Продавец: {sellerName}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Package" size={12} />
                {c.quantity} {c.unit}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-semibold text-sm">{c.totalAmount ? formatAmount(c.totalAmount, c.currency) : 'Договорная'}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {isConfirmed
                ? (c.sellerConfirmed && c.buyerConfirmed ? '✓ Оба подтвердили' : '○ Ожидание')
                : 'Покупатель'}
            </div>
          </div>
        </div>

        {c.responseId && onNegotiate && (
          <div className="mt-3 pt-3 border-t">
            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onNegotiate();
              }}
            >
              <Icon name="MessageSquare" size={14} className="mr-2" />
              Переговоры
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}