export interface OfferImage {
  id: string;
  url: string;
  alt: string;
}

export interface OfferVideo {
  id: string;
  url: string;
  thumbnail?: string;
}

export type DeliveryType = 'pickup' | 'delivery';
export type PaymentType = 'invoice' | 'cash' | 'mobile';

export interface Seller {
  id: string;
  name: string;
  type: 'individual' | 'self-employed' | 'entrepreneur' | 'legal-entity';
  phone: string;
  email: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  responsiblePerson?: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  statistics: {
    totalOffers: number;
    activeOffers: number;
    completedOrders: number;
    registrationDate: Date;
  };
  reviews?: Array<{
    id: string;
    reviewerId: string;
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: Date | string;
    offerTitle?: string;
  }>;
}

export interface Offer {
  id: string;
  userId: string;
  type: 'offer';
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  soldQuantity?: number;
  reservedQuantity?: number;
  minOrderQuantity?: number;
  unit: string;
  pricePerUnit: number;
  hasVAT: boolean;
  vatRate?: number;
  noNegotiation?: boolean;
  deliveryTime?: string;
  deliveryPeriodStart?: string;
  deliveryPeriodEnd?: string;
  location?: string;
  district: string;
  fullAddress?: string;
  availableDistricts: string[];
  images: OfferImage[];
  video?: OfferVideo;
  isPremium: boolean;
  seller?: Seller;
  createdAt: Date;
  updatedAt?: Date;
  expiryDate?: Date;
  availableDeliveryTypes: DeliveryType[];
  viewsCount?: number;
  views?: number;
  favorites?: number;
  orderedQuantity?: number;
  responses?: number;
  status?: 'active' | 'draft' | 'pending' | 'moderation' | 'archived';
}

export interface Request {
  id: string;
  userId: string;
  type: 'request';
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  hasVAT: boolean;
  vatRate?: number;
  negotiableQuantity?: boolean;
  negotiablePrice?: boolean;
  district: string;
  location?: string;
  deliveryAddress?: string;
  availableDistricts: string[];
  images: OfferImage[];
  video?: OfferVideo;
  isPremium: boolean;
  createdAt: Date;
  updatedAt?: Date;
  expiryDate?: Date;
  views?: number;
  responses?: number;
  status?: 'active' | 'draft' | 'pending' | 'closed' | 'archived';
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export type ContentType = 'offers' | 'requests';

export interface SearchFilters {
  query: string;
  contentType: ContentType;
  category: string;
  subcategory: string;
  district: string;
}