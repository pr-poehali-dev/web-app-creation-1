import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import ProductMediaGallery from '@/components/ProductMediaGallery';

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
  sellerRating: number;
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
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onCardClick(contract.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="secondary">
            {getContractTypeLabel(contract.contractType)}
          </Badge>
          {getStatusBadge(contract.status)}
        </div>
        <CardTitle className="text-lg line-clamp-2">{contract.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {contract.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProductMediaGallery 
          images={contract.productImages}
          videoUrl={contract.productVideoUrl}
          productName={contract.productName}
        />
        <div className="mt-3 border-t pt-3" />
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Icon name="Package" className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {contract.productName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Icon name="Scale" className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {contract.quantity} {contract.unit}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Icon name="Calendar" className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Поставка: {formatDate(contract.deliveryDate)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <div className="text-xs text-muted-foreground">Цена за единицу</div>
              <div className="font-semibold">{formatPrice(contract.pricePerUnit)}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Общая сумма</div>
              <div className="font-bold text-lg">{formatPrice(contract.totalAmount)}</div>
            </div>
          </div>

          {(contract.discountPercent > 0 || contract.financingAvailable) && (
            <div className="flex gap-2 pt-2 flex-wrap">
              {contract.discountPercent > 0 && (
                <Badge variant="secondary">
                  <Icon name="Percent" className="h-3 w-3 mr-1" />
                  Скидка {contract.discountPercent}%
                </Badge>
              )}
              {contract.financingAvailable && (
                <Badge variant="secondary">
                  <Icon name="CreditCard" className="h-3 w-3 mr-1" />
                  Финансирование
                </Badge>
              )}
            </div>
          )}

          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="User" className="h-4 w-4" />
                <span>{contract.sellerFirstName} {contract.sellerLastName}</span>
                <div className="flex items-center gap-1">
                  <Icon name="Star" className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{contract.sellerRating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Icon name="Eye" className="h-4 w-4" />
                <span>{contract.viewsCount}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
