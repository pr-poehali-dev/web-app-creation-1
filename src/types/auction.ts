export interface AuctionBid {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  timestamp: Date;
  isWinning: boolean;
}

export interface Auction {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  quantity: number;
  unit: string;
  startingPrice: number;
  currentPrice: number;
  currentBid: number;
  minBidStep: number;
  buyNowPrice?: number;
  hasVAT: boolean;
  vatRate?: number;
  location: string;
  district: string;
  fullAddress?: string;
  availableDistricts: string[];
  images: Array<{
    id: string;
    url: string;
    alt: string;
  }>;
  video?: {
    id: string;
    url: string;
    thumbnail?: string;
  };
  isPremium: boolean;
  seller: {
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
  };
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'ending-soon' | 'ended';
  bidsCount: number;
  bids: AuctionBid[];
  viewsCount?: number;
  createdAt: Date;
  updatedAt: Date;
  expiryDate?: string;
  availableDeliveryTypes: ('pickup' | 'delivery')[];
  winningBidId?: string;
}