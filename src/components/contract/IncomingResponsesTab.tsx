import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Contract, Respondent, formatAmount } from './ContractCard';

const RESPONSE_STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидает',
  confirmed: 'Заключён',
  cancelled: 'Отменён',
  rejected: 'Отклонён',
};

interface IncomingResponsesTabProps {
  contractsWithResponses: Contract[];
  incomingResponses: Record<number, Respondent[]>;
  onOpenNegotiation: (responseId: number, title: string) => void;
}

export default function IncomingResponsesTab({ contractsWithResponses, incomingResponses, onOpenNegotiation }: IncomingResponsesTabProps) {
  const navigate = useNavigate();

  if (contractsWithResponses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Icon name="Inbox" className="h-10 w-10 mx-auto mb-2 opacity-30" />
        <p>Откликов на ваши контракты пока нет</p>
      </div>
    );
  }

  return (
    <>
      {contractsWithResponses.map(c => {
        const responses = incomingResponses[c.id] || [];
        return (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-3">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => navigate(`/contract/${c.id}`)}
              >
                <span className="font-medium text-sm">{c.title || c.productName || `Контракт #${c.id}`}</span>
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 bg-orange-50 shrink-0">
                  <Icon name="Users" size={10} className="mr-1" />
                  {c.responsesCount} {(c.responsesCount ?? 0) === 1 ? 'отклик' : (c.responsesCount ?? 0) < 5 ? 'отклика' : 'откликов'}
                </Badge>
              </div>
              {responses.length > 0 ? (
                <div className="space-y-2">
                  {responses.map(r => {
                    const isConfirmed = r.status === 'confirmed';
                    const isCancelled = r.status === 'cancelled' || r.status === 'rejected';
                    return (
                      <div key={r.id} className="border rounded-lg p-3 space-y-1.5 text-sm">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{r.firstName} {r.lastName}</span>
                            <Badge
                              variant={isConfirmed ? 'default' : isCancelled ? 'destructive' : 'outline'}
                              className={`text-xs ${isConfirmed ? 'bg-green-100 text-green-700 border-green-200' : ''}`}
                            >
                              {RESPONSE_STATUS_LABELS[r.status] ?? r.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('ru-RU')}</span>
                        </div>
                        {(r.pricePerUnit ?? 0) > 0 && (
                          <div className="text-muted-foreground">
                            <span>Цена: </span><span className="font-medium text-foreground">{formatAmount(r.pricePerUnit!, c.currency)}</span>
                            <span className="ml-2">Итого: </span><span className="font-medium text-foreground">{formatAmount(r.totalAmount!, c.currency)}</span>
                          </div>
                        )}
                        {r.comment && <p className="text-muted-foreground">{r.comment}</p>}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {r.phone && <span className="flex items-center gap-1"><Icon name="Phone" size={12} />{r.phone}</span>}
                          </div>
                          {!isCancelled && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 h-7 text-xs"
                              onClick={() => onOpenNegotiation(r.id, c.title || c.productName || `Контракт #${c.id}`)}
                            >
                              <Icon name="MessageSquare" size={12} />
                              Переговоры
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-2">Нет откликов</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}