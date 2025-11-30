export interface OfferImage {
  id: string;
  url: string;
  alt: string;
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
  location: string;
  district: string;
  availableDistricts: string[];
  images: OfferImage[];
  isPremium: boolean;
  seller: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: Date;
  updatedAt: Date;
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
