import type { Offer, Request as OfferRequest } from '@/types/offer';
import type { Auction } from '@/types/auction';
import func2url from '../../backend/func2url.json';

const OFFERS_API = func2url.offers;
const ADMIN_OFFERS_API = func2url['admin-offers'];
const REQUESTS_API = func2url.requests;
const ADMIN_REQUESTS_API = func2url['admin-requests'];
const ORDERS_API = func2url.orders;
const AUCTIONS_LIST_API = func2url['auctions-list'];
const AUCTIONS_MY_API = func2url['auctions-my'];
const AUCTIONS_UPDATE_API = func2url['auctions-update'];
const UPLOAD_VIDEO_API = func2url['upload-video'];

const fetchCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

function getCacheKey(url: string, options?: RequestInit): string {
  const method = options?.method || 'GET';
  return `${method}:${url}`;
}

function getFromCache(key: string): any | null {
  const cached = fetchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  fetchCache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  fetchCache.set(key, { data, timestamp: Date.now() });
  if (fetchCache.size > 50) {
    const firstKey = fetchCache.keys().next().value;
    fetchCache.delete(firstKey);
  }
}

async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 2): Promise<Response> {
  const method = options?.method || 'GET';
  
  if (method === 'GET') {
    const cacheKey = getCacheKey(url, options);
    const cached = getFromCache(cacheKey);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok && method === 'GET') {
        const clonedResponse = response.clone();
        const data = await clonedResponse.json();
        const cacheKey = getCacheKey(url, options);
        setCache(cacheKey, data);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = 1000 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to fetch after retries');
}

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
  async getAll(): Promise<OffersListResponse> {
    const response = await fetchWithRetry(OFFERS_API);
    
    if (!response.ok) {
      throw new Error('Failed to fetch offers');
    }
    
    return response.json();
  },

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
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      const text = await response.text();
      console.error('Offers API error:', response.status, text.substring(0, 500));
      throw new Error(`Failed to fetch offers: ${response.status}`);
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', text.substring(0, 500));
      throw new Error('Invalid JSON response from server');
    }
  },

  async getOfferById(id: string): Promise<Offer> {
    const response = await fetchWithRetry(`${OFFERS_API}?id=${id}`);
    
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

    const response = await fetchWithRetry(OFFERS_API, {
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
    const response = await fetchWithRetry(`${OFFERS_API}?id=${id}`, {
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

  async deleteOffer(id: string): Promise<{ message: string }> {
    const userId = getUserId();

    const response = await fetchWithRetry(ADMIN_OFFERS_API, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId || 'anonymous',
      },
      body: JSON.stringify({ offerId: id }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete offer');
    }
    
    return response.json();
  },

  async uploadVideo(videoBase64: string): Promise<{ url: string; message: string }> {
    console.log('uploadVideo: Starting upload, data size:', videoBase64.length);
    const response = await fetchWithRetry(UPLOAD_VIDEO_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video: videoBase64 }),
    });
    
    console.log('uploadVideo: Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('uploadVideo: Error response:', error);
      throw new Error(error.error || 'Failed to upload video');
    }
    
    const result = await response.json();
    console.log('uploadVideo: Success, URL:', result.url);
    return result;
  },

  async getAdminOffers(params?: {
    search?: string;
    status?: string;
  }): Promise<OffersListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `${ADMIN_OFFERS_API}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const userId = getUserId();
    
    const response = await fetchWithRetry(url, {
      headers: {
        'X-User-Id': userId || 'anonymous',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin offers');
    }
    
    return response.json();
  },
};

export const requestsAPI = {
  async getAll(): Promise<RequestsListResponse> {
    const response = await fetchWithRetry(REQUESTS_API);
    
    if (!response.ok) {
      throw new Error('Failed to fetch requests');
    }
    
    return response.json();
  },

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
    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch requests');
    }
    
    return response.json();
  },

  async getRequestById(id: string): Promise<OfferRequest> {
    const response = await fetchWithRetry(`${REQUESTS_API}?id=${id}`);
    
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

    const response = await fetchWithRetry(REQUESTS_API, {
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
    const response = await fetchWithRetry(`${REQUESTS_API}/${id}`, {
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

  async deleteRequest(id: string): Promise<{ message: string }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchWithRetry(`${REQUESTS_API}?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete request');
    }
    
    return response.json();
  },

  async getAdminRequests(params?: {
    search?: string;
    status?: string;
  }): Promise<RequestsListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    
    const url = `${ADMIN_REQUESTS_API}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const userId = getUserId();
    
    const response = await fetchWithRetry(url, {
      headers: {
        'X-User-Id': userId || 'anonymous',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin requests');
    }
    
    return response.json();
  },

  async deleteAdminRequest(id: string): Promise<{ message: string }> {
    const userId = getUserId();

    const response = await fetchWithRetry(ADMIN_REQUESTS_API, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId || 'anonymous',
      },
      body: JSON.stringify({ requestId: id }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete request');
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
  offerId?: string;
  buyer_id?: number;
  seller_id?: number;
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
  async getAll(type?: 'all' | 'purchase' | 'sale', status?: string): Promise<OrdersListResponse> {
    const userId = getUserId();
    if (!userId) {
      return { orders: [], total: 0 };
    }

    try {
      const queryParams = new URLSearchParams();
      if (type) queryParams.append('type', type);
      if (status) queryParams.append('status', status);
      
      const url = `${ORDERS_API}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await fetchWithRetry(url, {
        headers: {
          'X-User-Id': userId,
        },
      });
      
      if (!response.ok) {
        return { orders: [], total: 0 };
      }
      
      const data = await response.json();
      return data;
    } catch {
      return { orders: [], total: 0 };
    }
  },

  async getOrderById(id: string): Promise<Order> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchWithRetry(`${ORDERS_API}?id=${id}`, {
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

    const response = await fetchWithRetry(ORDERS_API, {
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

  async updateOrder(id: string, data: { 
    status?: string; 
    trackingNumber?: string; 
    deliveryDate?: string; 
    sellerComment?: string; 
    cancellationReason?: string;
    counterPrice?: number;
    counterMessage?: string;
    acceptCounter?: boolean;
  }): Promise<{ message: string }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchWithRetry(`${ORDERS_API}?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update order');
    }
    
    return response.json();
  },

  async getMessagesByOffer(offerId: string): Promise<any[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchWithRetry(`${ORDERS_API}?offerId=${offerId}&messages=true`, {
      headers: {
        'X-User-Id': userId,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    return response.json();
  },

  async getMessagesByOrder(orderId: string): Promise<{ messages: any[] }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchWithRetry(`${ORDERS_API}?id=${orderId}&messages=true`, {
      headers: {
        'X-User-Id': userId,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch messages');
    }
    
    const data = await response.json();
    return { messages: data.messages || [] };
  },

  async createMessage(data: { orderId: string; senderId: number; senderType: 'buyer' | 'seller'; message: string }): Promise<any> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchWithRetry(`${ORDERS_API}?message=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create message');
    }
    
    return response.json();
  },

  async deleteOrder(id: string): Promise<{ message: string }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchWithRetry(`${ORDERS_API}?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete order');
    }
    
    return response.json();
  },
};

export interface AuctionsListResponse {
  auctions: Auction[];
}

export const auctionsAPI = {
  async getAllAuctions(status?: string): Promise<Auction[]> {
    let timezoneOffset = 9;
    try {
      const userLocation = localStorage.getItem('userLocation');
      if (userLocation) {
        const parsed = JSON.parse(userLocation);
        timezoneOffset = parsed.timezoneOffset || 9;
      }
    } catch (error) {
      console.error('Error parsing userLocation:', error);
      timezoneOffset = 9;
    }
    
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('timezoneOffset', timezoneOffset.toString());
    
    const response = await fetchWithRetry(`${AUCTIONS_LIST_API}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch auctions');
    }
    
    const data = await response.json();
    return (data.auctions || []).map((a: any) => {
      const safeDate = (dateStr: string | null | undefined): Date | undefined => {
        if (!dateStr) return undefined;
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? undefined : date;
        } catch {
          return undefined;
        }
      };

      return {
        ...a,
        startDate: safeDate(a.startDate),
        endDate: safeDate(a.endDate),
        startTime: safeDate(a.startDate),
        endTime: safeDate(a.endDate),
        createdAt: safeDate(a.createdAt),
      };
    });
  },

  async getMyAuctions(): Promise<Auction[]> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    let timezoneOffset = 9;
    try {
      const userLocation = localStorage.getItem('userLocation');
      if (userLocation) {
        const parsed = JSON.parse(userLocation);
        timezoneOffset = parsed.timezoneOffset || 9;
      }
    } catch (error) {
      console.error('Error parsing userLocation:', error);
      timezoneOffset = 9;
    }

    const response = await fetchWithRetry(`${AUCTIONS_MY_API}?timezoneOffset=${timezoneOffset}`, {
      headers: {
        'X-User-Id': userId,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch my auctions');
    }
    
    const data = await response.json();
    return (data.auctions || []).map((a: any) => {
      const safeDate = (dateStr: string | null | undefined): Date | undefined => {
        if (!dateStr) return undefined;
        try {
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? undefined : date;
        } catch {
          return undefined;
        }
      };

      return {
        ...a,
        startDate: safeDate(a.startDate),
        endDate: safeDate(a.endDate),
        createdAt: safeDate(a.createdAt),
      };
    });
  },

  async getAuctionById(id: string): Promise<Auction> {
    let timezoneOffset = 9;
    try {
      const userLocation = localStorage.getItem('userLocation');
      if (userLocation) {
        const parsed = JSON.parse(userLocation);
        timezoneOffset = parsed.timezoneOffset || 9;
      }
    } catch (error) {
      console.error('Error parsing userLocation:', error);
      timezoneOffset = 9;
    }
    
    const response = await fetchWithRetry(`${AUCTIONS_LIST_API}?id=${id}&timezoneOffset=${timezoneOffset}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch auction');
    }
    
    const data = await response.json();
    
    const safeDate = (dateStr: string | null | undefined): Date | undefined => {
      if (!dateStr) return undefined;
      try {
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? undefined : date;
      } catch {
        return undefined;
      }
    };

    return {
      ...data,
      startDate: safeDate(data.startDate),
      endDate: safeDate(data.endDate),
      startTime: safeDate(data.startDate),
      endTime: safeDate(data.endDate),
      createdAt: safeDate(data.createdAt),
      images: data.images || [],
    };
  },

  async deleteAuction(auctionId: string): Promise<void> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchWithRetry(AUCTIONS_MY_API, {
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

  async updateAuction(data: {
    auctionId: string;
    action: 'update' | 'reduce-price' | 'stop';
    title?: string;
    description?: string;
    startingPrice?: number;
    buyNowPrice?: number;
    minBidStep?: number;
    images?: Array<{ url: string; alt?: string }>;
    newPrice?: number;
  }): Promise<{ success: boolean; message: string }> {
    const userId = getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const response = await fetchWithRetry(AUCTIONS_UPDATE_API, {
      method: 'POST',
      headers: {
        'X-User-Id': userId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update auction');
    }
    
    return response.json();
  },
};