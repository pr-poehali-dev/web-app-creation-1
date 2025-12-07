import type { Offer, Request as OfferRequest } from '@/types/offer';
import func2url from '../../backend/func2url.json';

const OFFERS_API = func2url.offers;
const REQUESTS_API = func2url.requests;

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