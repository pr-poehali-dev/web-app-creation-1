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
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  hasVAT: boolean;
  vatRate?: number;
  location: string;
  district: string;
  fullAddress?: string;
  availableDistricts: string[];
  images: OfferImage[];
  video?: OfferVideo;
  isPremium: boolean;
  seller: Seller;
  createdAt: Date;
  updatedAt: Date;
  expiryDate?: Date;
  availableDeliveryTypes: DeliveryType[];
  viewsCount?: number;
  orderedQuantity?: number;
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