import type { Offer, Request } from '@/types/offer';

export function isExpired(item: Offer | Request): boolean {
  const now = new Date();

  if ('deliveryPeriodEnd' in item && item.deliveryPeriodEnd) {
    const deliveryEnd = new Date(item.deliveryPeriodEnd);
    if (deliveryEnd < now) return true;
  }

  if (!item.expiryDate) return false;
  return new Date(item.expiryDate) < now;
}

export function filterActiveOffers(offers: Offer[]): Offer[] {
  return offers.filter(offer => !isExpired(offer));
}

export function filterActiveRequests(requests: Request[]): Request[] {
  return requests.filter(request => !isExpired(request));
}

export function getExpirationStatus(item: Offer | Request): {
  isExpired: boolean;
  daysRemaining: number | null;
  expiryDate: Date | null;
} {
  if (!item.expiryDate) {
    return {
      isExpired: false,
      daysRemaining: null,
      expiryDate: null,
    };
  }
  
  const expiryDate = new Date(item.expiryDate);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    isExpired: diffTime < 0,
    daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
    expiryDate,
  };
}