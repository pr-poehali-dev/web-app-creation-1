import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { offersAPI } from '@/services/api';
import type { Offer } from '@/types/offer';

function getUserId(): string | null {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr).id;
  } catch {
    return null;
  }
}

let cachedOffersCount = 0;
const offersCountListeners: Array<(n: number) => void> = [];

export function useMyOffersCount(): number {
  const [count, setCount] = useState(cachedOffersCount);
  useEffect(() => {
    offersCountListeners.push(setCount);
    setCount(cachedOffersCount);
    return () => {
      const idx = offersCountListeners.indexOf(setCount);
      if (idx !== -1) offersCountListeners.splice(idx, 1);
    };
  }, []);
  return count;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Активно', className: 'bg-green-50 text-green-700 border-green-200' },
  moderation: { label: 'На модерации', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  pending: { label: 'На проверке', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  archived: { label: 'В архиве', className: 'bg-muted text-muted-foreground' },
};

export default function MyOffersSection() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    setIsLoading(true);
    offersAPI.getOffers({ userId, status: 'all', limit: 100 })
      .then(res => {
        const list = res.offers || [];
        setOffers(list);
        cachedOffersCount = list.length;
        offersCountListeners.forEach(fn => fn(list.length));
      })
      .catch(() => setOffers([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || offers.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Мои предложения</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/create-offer')}>
          <Icon name="Plus" className="h-4 w-4 mr-1" />
          Создать
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map(offer => {
          const image = offer.images?.[0]?.url;
          const statusInfo = STATUS_LABELS[offer.status || 'active'] || STATUS_LABELS.active;
          return (
            <Card
              key={offer.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/offer/${offer.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex gap-3">
                  {image ? (
                    <img src={image} alt={offer.title} className="w-16 h-16 object-cover rounded-md shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center shrink-0">
                      <Icon name="Package" className="h-7 w-7 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2 mb-1">{offer.title}</p>
                    {offer.category === 'transport' && offer.transportRoute && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                        {offer.transportRoute}
                      </p>
                    )}
                    <p className="text-sm text-primary font-semibold mb-1">
                      {offer.category === 'transport'
                        ? (offer.transportNegotiable || !offer.transportPrice)
                          ? 'Ваша цена'
                          : `${Number(offer.transportPrice).toLocaleString('ru-RU')} ₽`
                        : `${offer.pricePerUnit?.toLocaleString('ru-RU')} ₽/${offer.unit}`
                      }
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-xs ${statusInfo.className}`}>
                        {statusInfo.label}
                      </Badge>
                      {(offer.responses ?? 0) > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {offer.responses} {(offer.responses ?? 0) === 1 ? 'отклик' : 'откликов'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}