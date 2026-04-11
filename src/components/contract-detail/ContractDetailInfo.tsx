import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { formatOrgName } from '@/lib/formatOrgName';

interface Contract {
  id: number;
  title: string;
  description: string;
  status: string;
  contractType: string;
  category: string;
  productName: string;
  productSpecs?: Record<string, string | string[]>;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  currency: string;
  deliveryDate: string;
  contractStartDate: string;
  contractEndDate: string;
  deliveryAddress: string;
  deliveryMethod: string;
  prepaymentPercent: number;
  prepaymentAmount: number;
  termsConditions: string;
  sellerFirstName: string;
  sellerLastName: string;
  sellerCompanyName?: string;
  sellerRating: number;
  buyerFirstName?: string;
  buyerLastName?: string;
  sellerId: number;
  financingAvailable: boolean;
  discountPercent: number;
  viewsCount: number;
  createdAt: string;
  productImages?: string[];
  productVideoUrl?: string;
}

interface ContractDetailInfoProps {
  contract: Contract;
  isBarter: boolean;
  formatDate: (d: string) => string;
  formatPrice: (p: number) => string;
}

function PhotoGallery({ images, title }: { images: string[]; title: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((url, i) => (
          <button key={i} type="button" onClick={() => setLightbox(url)} className="aspect-square rounded-lg overflow-hidden border hover:opacity-90 transition-opacity">
            <img src={url} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button type="button" className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <Icon name="X" size={28} />
          </button>
          <img src={lightbox} alt="Фото" className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default function ContractDetailInfo({ contract, isBarter, formatDate, formatPrice }: ContractDetailInfoProps) {
  const imagesB = Array.isArray(contract.productSpecs?.productImagesB)
    ? (contract.productSpecs!.productImagesB as string[])
    : [];

  return (
    <>
      {/* Товар */}
      <Card>
        <CardHeader><CardTitle className="text-base">Товар</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Наименование</div>
              <div className="font-medium">{contract.productName}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Количество</div>
              <div className="font-medium">{contract.quantity} {contract.unit}</div>
            </div>
            {!isBarter && (
              <>
                <div>
                  <div className="text-muted-foreground">Цена за единицу</div>
                  <div className="font-medium">{formatPrice(contract.pricePerUnit)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Общая сумма</div>
                  <div className="font-bold text-lg">{formatPrice(contract.totalAmount)}</div>
                </div>
              </>
            )}
            {isBarter && contract.productSpecs && (
              <>
                <div>
                  <div className="text-muted-foreground">В обмен (Товар Б)</div>
                  <div className="font-medium">{contract.productSpecs.productNameB}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Кол-во Товара Б</div>
                  <div className="font-medium">{contract.productSpecs.quantityB} {contract.productSpecs.unitB}</div>
                </div>
              </>
            )}
          </div>

          {/* Фото товаров */}
          {(contract.productImages?.length || imagesB.length) ? (
            <div className="pt-2 space-y-4 border-t mt-3">
              <PhotoGallery images={contract.productImages || []} title="Фото товара А" />
              {isBarter && <PhotoGallery images={imagesB} title="Фото товара Б" />}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Сроки и доставка */}
      <Card>
        <CardHeader><CardTitle className="text-base">Сроки и доставка</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Дата поставки</div>
              <div className="font-medium">{formatDate(contract.deliveryDate)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Срок контракта</div>
              <div className="font-medium">{formatDate(contract.contractStartDate)} — {formatDate(contract.contractEndDate)}</div>
            </div>
            {contract.deliveryAddress && (
              <div className="col-span-2">
                <div className="text-muted-foreground">Адрес доставки</div>
                <div className="font-medium">{contract.deliveryAddress}</div>
              </div>
            )}
            {contract.deliveryMethod && (
              <div>
                <div className="text-muted-foreground">Способ доставки</div>
                <div className="font-medium">{contract.deliveryMethod}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Оплата */}
      {!isBarter && (contract.prepaymentPercent > 0 || contract.financingAvailable) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Оплата</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {contract.prepaymentPercent > 0 && (
                <>
                  <div>
                    <div className="text-muted-foreground">Предоплата</div>
                    <div className="font-medium">{contract.prepaymentPercent}%</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Сумма предоплаты</div>
                    <div className="font-medium">{formatPrice(contract.prepaymentAmount)}</div>
                  </div>
                </>
              )}
              {contract.financingAvailable && (
                <div className="col-span-2">
                  <Badge variant="secondary">
                    <Icon name="CreditCard" className="h-3 w-3 mr-1" />
                    Финансирование доступно
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Доп. условия */}
      {contract.termsConditions && (
        <Card>
          <CardHeader><CardTitle className="text-base">Дополнительные условия</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm">{contract.termsConditions}</p>
          </CardContent>
        </Card>
      )}

      {/* Поставщик */}
      <Card>
        <CardHeader><CardTitle className="text-base">Поставщик</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Icon name="Building2" className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-medium">
                {formatOrgName(contract.sellerCompanyName) || `${contract.sellerFirstName} ${contract.sellerLastName}`.trim() || 'Не указано'}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Icon name="ShieldCheck" className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">{(contract.sellerRating || 0).toFixed(1)}</span>
                <span className="ml-1">Рейтинг надёжности</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}