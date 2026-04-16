import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { formatOrgName } from '@/lib/formatOrgName';

function MapModal({ address, onClose }: { address: string; onClose: () => void }) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    const q = encodeURIComponent(address);
    fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'ru' },
    })
      .then(r => r.json())
      .then(data => {
        if (data && data[0]) {
          const { lat, lon } = data[0];
          setCoords({ lat, lon });
          setMapUrl(
            `https://www.openstreetmap.org/export/embed.html?bbox=${Number(lon) - 0.015},${Number(lat) - 0.015},${Number(lon) + 0.015},${Number(lat) + 0.015}&layer=mapnik&marker=${lat},${lon}`
          );
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [address]);

  const routeUrl = coords
    ? `https://yandex.ru/maps/?rtext=~${coords.lat},${coords.lon}&rtt=auto`
    : `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Icon name="MapPin" size={16} className="text-primary" />
            <span className="font-semibold text-sm">Местоположение</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-full">
            <Icon name="X" size={18} />
          </button>
        </div>

        <div className="px-4 py-2 text-sm text-muted-foreground border-b">{address}</div>

        <div className="relative bg-muted" style={{ height: 320 }}>
          {mapUrl ? (
            <iframe
              src={mapUrl}
              width="100%"
              height="320"
              style={{ border: 0, display: 'block' }}
              loading="lazy"
              title="Карта"
            />
          ) : notFound ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground text-sm">
              <Icon name="MapPinOff" size={32} />
              <span>Адрес не найден на карте</span>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full gap-2 text-muted-foreground text-sm">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
              Загрузка карты...
            </div>
          )}
        </div>

        <div className="p-4 flex gap-2">
          <Button
            className="flex-1"
            onClick={() => window.open(routeUrl, '_blank')}
          >
            <Icon name="Navigation" size={16} className="mr-2" />
            Проложить маршрут
          </Button>
          <Button variant="outline" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  priceType?: string;
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
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const isNegotiable = contract.priceType === 'negotiable' || (contract.productSpecs?.priceType === 'negotiable') || (!contract.pricePerUnit && !contract.totalAmount && !isBarter);

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
              isNegotiable ? (
                <div className="col-span-2">
                  <div className="flex items-center gap-2 py-1">
                    <Icon name="Handshake" size={16} className="text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">Цена договорная — обсуждается с продавцом</span>
                  </div>
                </div>
              ) : (
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
              )
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
            {!isBarter && (
              <div>
                <div className="text-muted-foreground">Дата поставки</div>
                <div className="font-medium">{formatDate(contract.deliveryDate)}</div>
              </div>
            )}
            {!isBarter && (
              <div>
                <div className="text-muted-foreground">Срок контракта</div>
                <div className="font-medium">{formatDate(contract.contractStartDate)} — {formatDate(contract.contractEndDate)}</div>
              </div>
            )}
            {contract.deliveryAddress && (
              <div className="col-span-2">
                <div className="text-muted-foreground">Адрес доставки</div>
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{contract.deliveryAddress}</div>
                  <button
                    onClick={() => setMapModalOpen(true)}
                    className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                  >
                    <Icon name="MapPin" size={13} />
                    На карте
                  </button>
                </div>
              </div>
            )}
            {mapModalOpen && contract.deliveryAddress && (
              <MapModal address={contract.deliveryAddress} onClose={() => setMapModalOpen(false)} />
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
                    {isNegotiable ? (
                      <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                        <Icon name="Handshake" size={14} />
                        Договорная
                      </div>
                    ) : (
                      <div className="font-medium">{formatPrice(contract.prepaymentAmount)}</div>
                    )}
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