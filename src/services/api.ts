import type { Offer, Request as OfferRequest } from '@/types/offer';
import type { Auction } from '@/types/auction';
import func2url from '../../backend/func2url.json';

const OFFERS_API = func2url.offers;
const REQUESTS_API = func2url.requests;
const ORDERS_API = func2url.orders;
const AUCTIONS_LIST_API = func2url['auctions-list'];
const AUCTIONS_MY_API = func2url['auctions-my'];

export interface OffersListResponse {
  offers: Offer[];
  total: number;
}

export interface RequestsListResponse {
  requests: OfferRequest[];
  total: number;
}

export interface CreateOfferData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  hasVAT: boolean;
  vatRate?: number;
  location?: string;
  district: string;
  fullAddress?: string;
  availableDistricts: string[];
  images?: Array<{ url: string; alt?: string }>;
  availableDeliveryTypes?: string[];
  isPremium?: boolean;
  status?: string;
}

export interface CreateRequestData {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  hasVAT: boolean;
  vatRate?: number;
  district: string;
  deliveryAddress?: string;
  availableDistricts: string[];
  images?: Array<{ url: string; alt?: string }>;
  isPremium?: boolean;
  status?: string;
}

function getUserId(): string | null {
  const userStr = localStorage.getItem('currentUser');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return user.id;
  } catch {
    return null;
  }
}

export const offersAPI = {
  async getOffers(params?: {
    category?: string;
    subcategory?: string;
    district?: string;
    query?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<OffersListResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const url = `${OFFERS_API}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch offers');
    }
    
    return response.json();
  },

  async getOfferById(id: string): Promise<Offer> {
    const response = await fetch(`${OFFERS_API}?id=${id}`);
    
    if (!response.ok) {
      console.error('HTTP', response.status, ':', `${OFFERS_API}?id=${id}`);
      throw new Error('Failed to fetch offer');
    }
    
    return response.json();
  },

  async createOffer(data: CreateOfferData): Promise<{ id: string; message: string }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(OFFERS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create offer');
    }
    
    return response.json();
  },

  async updateOffer(id: string, data: Partial<CreateOfferData>): Promise<{ message: string }> {
    const response = await fetch(`${OFFERS_API}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update offer');
    }
    
    return response.json();
  },
};

export const requestsAPI = {
  async getRequests(params?: {
    category?: string;
    subcategory?: string;
    district?: string;
    query?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<RequestsListResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const url = `${REQUESTS_API}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch requests');
    }
    
    return response.json();
  },

  async getRequestById(id: string): Promise<OfferRequest> {
    const response = await fetch(`${REQUESTS_API}?id=${id}`);
    
    if (!response.ok) {
      console.error('HTTP', response.status, ':', `${REQUESTS_API}?id=${id}`);
      throw new Error('Failed to fetch request');
    }
    
    return response.json();
  },

  async createRequest(data: CreateRequestData): Promise<{ id: string; message: string }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(REQUESTS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create request');
    }
    
    return response.json();
  },

  async updateRequest(id: string, data: Partial<CreateRequestData>): Promise<{ message: string }> {
    const response = await fetch(`${REQUESTS_API}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update request');
    }
    
    return response.json();
  },
};

export interface CreateOrderData {
  offerId: string;
  title: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  hasVAT: boolean;
  vatRate?: number;
  deliveryType: string;
  deliveryAddress: string;
  district: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  buyerCompany?: string;
  buyerInn?: string;
  buyerComment?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: 'purchase' | 'sale';
  title: string;
  counterparty: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  status: 'new' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  district: string;
  orderDate: string;
  deliveryDate?: string;
  trackingNumber?: string;
  deliveryType: string;
  deliveryAddress?: string;
}

export interface OrdersListResponse {
  orders: Order[];
  total: number;
}

export const ordersAPI = {
  async getUserOrders(params?: {
    type?: 'all' | 'purchase' | 'sale';
    status?: string;
  }): Promise<OrdersListResponse> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }
    
    const url = `${ORDERS_API}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url, {
      headers: {
        'X-User-Id': userId,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }
    
    return response.json();
  },

  async getOrderById(id: string): Promise<Order> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${ORDERS_API}?id=${id}`, {
      headers: {
        'X-User-Id': userId,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }
    
    return response.json();
  },

  async createOrder(data: CreateOrderData): Promise<{ id: string; orderNumber: string; orderDate: string; message: string }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(ORDERS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }
    
    return response.json();
  },

  async updateOrder(id: string, data: { status?: string; trackingNumber?: string; deliveryDate?: string; sellerComment?: string; cancellationReason?: string }): Promise<{ message: string }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${ORDERS_API}?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update order');
    }
    
    return response.json();
  },
};

export interface AuctionsListResponse {
  auctions: Auction[];
}

export const auctionsAPI = {
  async getAllAuctions(status?: string): Promise<Auction[]> {
    const queryParams = status ? `?status=${status}` : '';
    const response = await fetch(`${AUCTIONS_LIST_API}${queryParams}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch auctions');
    }
    
    const data = await response.json();
    return (data.auctions || []).map((a: any) => ({
      ...a,
      startDate: a.startDate ? new Date(a.startDate) : undefined,
      endDate: a.endDate ? new Date(a.endDate) : undefined,
      startTime: a.startDate ? new Date(a.startDate) : undefined,
      endTime: a.endDate ? new Date(a.endDate) : undefined,
      createdAt: a.createdAt ? new Date(a.createdAt) : undefined,
    }));
  },

  async getMyAuctions(): Promise<Auction[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(AUCTIONS_MY_API, {
      headers: {
        'X-User-Id': userId,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch my auctions');
    }
    
    const data = await response.json();
    return (data.auctions || []).map((a: any) => ({
      ...a,
      startDate: new Date(a.startDate),
      endDate: new Date(a.endDate),
      createdAt: new Date(a.createdAt),
    }));
  },

  async deleteAuction(auctionId: string): Promise<void> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(AUCTIONS_MY_API, {
      method: 'DELETE',
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ auctionId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete auction');
    }
  },
};