import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

export interface Respondent {
  id: number;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  pricePerUnit?: number;
  totalAmount?: number;
  comment?: string;
  status: string;
  createdAt: string;
  sellerConfirmed?: boolean;
  buyerConfirmed?: boolean;
}

export interface Contract {
  id: number;
  title: string;
  description: string;
  status: string;
  contractType: string;
  category: string;
  productName: string;
  totalAmount: number;
  currency: string;
  quantity: number;
  unit: string;
  contractStartDate: string;
  contractEndDate: string;
  sellerId: number;
  buyerId: number;
  sellerFirstName: string;
  sellerLastName: string;
  buyerFirstName: string;
  buyerLastName: string;
  createdAt: string;
  responsesCount?: number;
  recentRespondents?: Respondent[];
  responseId?: number;
  respondentFirstName?: string;
  respondentLastName?: string;
  myResponseStatus?: string;
  sellerConfirmed?: boolean;
  buyerConfirmed?: boolean;
}

export const STATUS_LABELS: Record<string, string> = {
  open: 'Открыт',
  draft: 'Черновик',
  signed: 'Подписан',
  in_progress: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
};

export const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  draft: 'outline',
  signed: 'default',
  in_progress: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
};

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  forward: 'Предложение',
  'forward-request': 'Запрос на закупку',
  barter: 'Бартер',
};

export function formatAmount(amount: number, currency = 'RUB') {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string) {
  if (!dateStr || dateStr === 'None' || dateStr === 'null') return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU');
  } catch {
    return '—';
  }
}

export default function ContractCard({ contract, currentUserId, onClick }: { contract: Contract; currentUserId: number; onClick: () => void }) {
  const isSeller = contract.sellerId === currentUserId;
  const isRequest = contract.contractType === 'forward-request';
  const counterparty = isSeller
    ? `${contract.buyerFirstName || ''} ${contract.buyerLastName || ''}`.trim() || (isRequest ? 'Поставщик' : 'Покупатель')
    : `${contract.sellerFirstName || ''} ${contract.sellerLastName || ''}`.trim() || (isRequest ? 'Покупатель' : 'Продавец');

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm truncate">{contract.title || contract.productName || `Контракт #${contract.id}`}</span>
              <Badge variant={STATUS_VARIANTS[contract.status] ?? 'outline'} className="text-xs shrink-0">
                {STATUS_LABELS[contract.status] ?? contract.status}
              </Badge>
              {contract.contractType && CONTRACT_TYPE_LABELS[contract.contractType] && (
                <Badge variant="outline" className="text-xs shrink-0">
                  {CONTRACT_TYPE_LABELS[contract.contractType]}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{contract.description || '—'}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon name="User" size={12} />
                {isSeller ? (isRequest ? 'Поставщик' : 'Покупатель') : (isRequest ? 'Покупатель' : 'Продавец')}: {counterparty}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Package" size={12} />
                {contract.quantity} {contract.unit}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={12} />
                с {formatDate(contract.contractStartDate)}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Calendar" size={12} />
                по {formatDate(contract.contractEndDate)}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-semibold text-sm">{contract.totalAmount ? formatAmount(contract.totalAmount, contract.currency) : 'Договорная'}</div>
            <div className="text-xs text-muted-foreground mt-1">{isSeller ? (isRequest ? 'Инициатор' : 'Продавец') : (isRequest ? 'Поставщик' : 'Покупатель')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
