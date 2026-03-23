import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Response {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  pricePerUnit: number;
  totalAmount: number;
  comment: string;
  status: string;
  createdAt: string;
}

interface ContractDetailResponsesProps {
  responses: Response[];
  isSeller: boolean;
  contractStatus: string;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(n);

export default function ContractDetailResponses({ responses, isSeller, contractStatus }: ContractDetailResponsesProps) {
  if (!isSeller) return null;

  if (responses.length === 0 && contractStatus === 'open') {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          <Icon name="Inbox" className="h-8 w-8 mx-auto mb-2 opacity-30" />
          Откликов пока нет
        </CardContent>
      </Card>
    );
  }

  if (responses.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon name="Users" className="h-4 w-4" />
          Отклики ({responses.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {responses.map(r => (
          <div key={r.id} className="border rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{r.firstName} {r.lastName}</span>
              <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
            {r.pricePerUnit > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Цена: </span>
                <span className="font-medium">{formatCurrency(r.pricePerUnit)} / ед.</span>
                <span className="text-muted-foreground ml-2">Итого: </span>
                <span className="font-medium">{formatCurrency(r.totalAmount)}</span>
              </div>
            )}
            {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
              {r.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={12} />{r.phone}</span>}
              {r.email && <span className="flex items-center gap-1"><Icon name="Mail" size={12} />{r.email}</span>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
