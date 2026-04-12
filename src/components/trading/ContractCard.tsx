import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { formatOrgName } from '@/lib/formatOrgName';

interface Contract {
  id: number;
  contractType: string;
  title: string;
  description: string;
  category: string;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  deliveryDate: string;
  status: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerCompanyName?: string;
  sellerRating: number;
  reliabilityScore?: number | null;
  discountPercent: number;
  financingAvailable: boolean;
  viewsCount: number;
  createdAt: string;
  productImages?: string[];
  productVideoUrl?: string;
}

interface ContractCardProps {
  contract: Contract;
  onCardClick: (contractId: number) => void;
  getContractTypeLabel: (type: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
  formatDate: (dateString: string) => string;
  formatPrice: (price: number) => string;
}

export default function ContractCard({
  contract,
  onCardClick,
  getContractTypeLabel,
  getStatusBadge,
  formatDate,
  formatPrice,
}: ContractCardProps) {
  const orgName = formatOrgName(contract.sellerCompanyName) || `${contract.sellerFirstName} ${contract.sellerLastName}`.trim() || 'Не указано';

  return (
    <Card
      className="border border-border hover:border-2 hover:border-primary transition-all cursor-pointer"
      onClick={() => onCardClick(contract.id)}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" className="text-xs shrink-0">
              {getContractTypeLabel(contract.contractType)}
            </Badge>
            {getStatusBadge(contract.status)}
          </div>

          <div className="font-semibold text-sm line-clamp-2 leading-tight">{contract.title}</div>
          <div className="text-xs text-muted-foreground line-clamp-1">{contract.description}</div>

          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon name="Package" className="h-3 w-3 shrink-0" />
              <span>{contract.productName} · {contract.quantity} {contract.unit}</span>
            </div>
            {contract.contractType !== 'barter' && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon name="Calendar" className="h-3 w-3 shrink-0" />
                <span>Поставка: {formatDate(contract.deliveryDate)}</span>
              </div>
            )}
          </div>

          {contract.contractType === 'barter' ? (
            <div className="flex items-center justify-between pt-2 border-t">
              <Badge variant="secondary" className="text-sm font-semibold">
                <Icon name="ArrowLeftRight" className="h-3.5 w-3.5 mr-1.5" />
                Обмен товарами
              </Badge>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <div className="text-xs text-muted-foreground">За единицу</div>
                <div className="text-sm font-semibold">{formatPrice(contract.pricePerUnit)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Итого</div>
                <div className="font-bold text-base">{formatPrice(contract.totalAmount)}</div>
              </div>
            </div>
          )}

          {(contract.discountPercent > 0 || contract.financingAvailable) && (
            <div className="flex gap-1.5 flex-wrap">
              {contract.discountPercent > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Icon name="Percent" className="h-3 w-3 mr-1" />
                  Скидка {contract.discountPercent}%
                </Badge>
              )}
              {contract.financingAvailable && (
                <Badge variant="secondary" className="text-xs">
                  <Icon name="CreditCard" className="h-3 w-3 mr-1" />
                  Финансирование
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon name="Building2" className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="truncate font-medium">{orgName}</span>
              {contract.reliabilityScore != null ? (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Icon name="ShieldCheck" className="h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">{contract.reliabilityScore}%</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Icon name="ShieldCheck" className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium text-[10px]">нет сделок</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <Icon name="Eye" className="h-3 w-3" />
              <span>{contract.viewsCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}