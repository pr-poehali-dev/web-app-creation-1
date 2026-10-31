import { SITE_URL } from '@/components/SEO';
import { stripFormatting } from '@/components/ui/FormattedText';

type Json = Record<string, unknown>;

interface ListingBase {
  id: string;
  title: string;
  description?: string;
  category?: string;
  unit?: string;
  images?: Array<{ url: string }>;
  seller?: { name?: string };
}

const ORG: Json = { '@type': 'Organization', name: 'ЕРТТП', url: SITE_URL };

const plain = (text?: string) => (text ? stripFormatting(text).replace(/\s+/g, ' ').trim().slice(0, 500) : undefined);

const images = (item: ListingBase) => {
  const urls = (item.images || []).map((i) => i.url).filter(Boolean);
  return urls.length ? urls : undefined;
};

const toDate = (value?: string | Date) => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
};

export function breadcrumbs(items: Array<{ name: string; path: string }>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export function offerSchema(
  offer: ListingBase & { pricePerUnit?: number; quantity?: number; soldQuantity?: number; expiryDate?: Date | string },
  categoryName?: string,
): Json[] {
  const url = `${SITE_URL}/offer/${offer.id}`;
  const left = (offer.quantity ?? 0) - (offer.soldQuantity ?? 0);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: offer.title,
      description: plain(offer.description),
      image: images(offer),
      category: categoryName || offer.category,
      url,
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'RUB',
        price: offer.pricePerUnit ?? undefined,
        priceValidUntil: toDate(offer.expiryDate),
        availability: left > 0 || !offer.quantity ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        eligibleQuantity: offer.unit ? { '@type': 'QuantitativeValue', unitText: offer.unit } : undefined,
        seller: offer.seller?.name ? { '@type': 'Organization', name: offer.seller.name } : ORG,
      },
    },
    breadcrumbs([
      { name: 'Главная', path: '/' },
      { name: 'Предложения', path: '/' },
      { name: offer.title, path: `/offer/${offer.id}` },
    ]),
  ];
}

export function requestSchema(
  request: ListingBase & { pricePerUnit?: number; quantity?: number; expiryDate?: Date | string },
  categoryName?: string,
): Json[] {
  const url = `${SITE_URL}/request/${request.id}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Demand',
      name: request.title,
      description: plain(request.description),
      url,
      image: images(request),
      category: categoryName || request.category,
      availabilityEnds: toDate(request.expiryDate),
      priceSpecification: request.pricePerUnit
        ? { '@type': 'UnitPriceSpecification', price: request.pricePerUnit, priceCurrency: 'RUB', unitText: request.unit }
        : undefined,
      eligibleQuantity: request.quantity ? { '@type': 'QuantitativeValue', value: request.quantity, unitText: request.unit } : undefined,
      seller: request.seller?.name ? { '@type': 'Organization', name: request.seller.name } : ORG,
    },
    breadcrumbs([
      { name: 'Главная', path: '/' },
      { name: 'Запросы', path: '/zaprosy' },
      { name: request.title, path: `/request/${request.id}` },
    ]),
  ];
}

export function auctionSchema(
  auction: ListingBase & { startingPrice?: number; currentPrice?: number; buyNowPrice?: number; startDate?: string; endDate?: string; status?: string },
  categoryName?: string,
): Json[] {
  const url = `${SITE_URL}/auction/${auction.id}`;
  const open = auction.status === 'active' || auction.status === 'ending-soon' || auction.status === 'upcoming';
  const price = auction.currentPrice || auction.startingPrice;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: auction.title,
      description: plain(auction.description),
      image: images(auction),
      category: categoryName || auction.category,
      url,
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'RUB',
        price: price ?? undefined,
        availabilityStarts: auction.startDate,
        availabilityEnds: auction.endDate,
        priceValidUntil: toDate(auction.endDate),
        availability: open ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
        seller: auction.seller?.name ? { '@type': 'Organization', name: auction.seller.name } : ORG,
      },
    },
    breadcrumbs([
      { name: 'Главная', path: '/' },
      { name: 'Аукционы', path: '/auction' },
      { name: auction.title, path: `/auction/${auction.id}` },
    ]),
  ];
}

export function collectionSchema(name: string, description: string, path: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${SITE_URL}${path}`,
    isPartOf: { '@type': 'WebSite', name: 'ЕРТТП', url: SITE_URL },
  };
}
