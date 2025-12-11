import type { Offer, Request } from '@/types/offer';

const SEED_OFFERS: Offer[] = [
  {
    id: 'seed-offer-1',
    userId: '1',
    title: 'Цемент М500, 50 кг',
    description: 'Высококачественный цемент марки М500. Идеально подходит для строительных и ремонтных работ. Гарантия качества от производителя.',
    category: 'cement',
    district: 'center',
    pricePerUnit: 450,
    quantity: 100,
    unit: 'мешок',
    images: [
      { url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400', alt: 'Цемент М500' }
    ],
    status: 'active',
    views: 45,
    isPremium: false,
    createdAt: new Date('2024-12-08T10:00:00')
  },
  {
    id: 'seed-offer-2',
    userId: '1',
    title: 'Кирпич облицовочный красный',
    description: 'Керамический облицовочный кирпич красного цвета. Морозостойкий, долговечный. Размер стандарт 250x120x65 мм.',
    category: 'brick',
    district: 'north',
    pricePerUnit: 25,
    quantity: 5000,
    unit: 'шт',
    images: [
      { url: 'https://images.unsplash.com/photo-1563212034-57571a7edafe?w=400', alt: 'Кирпич облицовочный' }
    ],
    status: 'active',
    views: 78,
    isPremium: true,
    createdAt: new Date('2024-12-07T14:30:00')
  },
  {
    id: 'seed-offer-3',
    userId: '1',
    title: 'Песок строительный карьерный',
    description: 'Песок карьерный для строительных работ. Фракция 0-5 мм. Без примесей глины. Доставка по городу.',
    category: 'sand',
    district: 'south',
    pricePerUnit: 800,
    quantity: 50,
    unit: 'тонна',
    images: [
      { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', alt: 'Песок строительный' }
    ],
    status: 'active',
    views: 32,
    isPremium: false,
    createdAt: new Date('2024-12-06T09:15:00')
  }
];

const SEED_REQUESTS: Request[] = [
  {
    id: 'seed-request-1',
    userId: '1',
    title: 'Требуется щебень гранитный',
    description: 'Нужен щебень гранитный фракции 20-40 мм для фундамента. Объем 15 тонн. Район доставки - центр города.',
    category: 'gravel',
    district: 'center',
    pricePerUnit: 1500,
    quantity: 15,
    unit: 'тонна',
    status: 'active',
    views: 23,
    responses: 5,
    createdAt: new Date('2024-12-09T11:00:00')
  },
  {
    id: 'seed-request-2',
    userId: '1',
    title: 'Куплю арматуру А500',
    description: 'Требуется арматура класса А500, диаметр 12 мм. Длина 11,7 м. Количество 2 тонны. Самовывоз.',
    category: 'reinforcement',
    district: 'east',
    pricePerUnit: 55000,
    quantity: 2,
    unit: 'тонна',
    status: 'active',
    views: 18,
    responses: 3,
    createdAt: new Date('2024-12-08T16:45:00')
  }
];

export function initializeSeedData() {
  const offersKey = 'marketplace_offers';
  const requestsKey = 'marketplace_requests';

  const existingOffers = localStorage.getItem(offersKey);
  const existingRequests = localStorage.getItem(requestsKey);

  if (!existingOffers || JSON.parse(existingOffers).length === 0) {
    localStorage.setItem(offersKey, JSON.stringify(SEED_OFFERS));
    console.log('Seed offers initialized');
  }

  if (!existingRequests || JSON.parse(existingRequests).length === 0) {
    localStorage.setItem(requestsKey, JSON.stringify(SEED_REQUESTS));
    console.log('Seed requests initialized');
  }
}
