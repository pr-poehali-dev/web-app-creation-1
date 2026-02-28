import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { Offer, Request } from '@/types/offer';
import { requestsAPI } from '@/services/api';

interface OffersContextType {
  offers: Offer[];
  requests: Request[];
  addOffer: (offer: Offer) => void;
  addRequest: (request: Request) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  updateRequest: (id: string, updates: Partial<Request>) => void;
  deleteOffer: (id: string) => void;
  deleteRequest: (id: string) => Promise<void>;
  refreshOffers: () => void;
  setOffers: (offers: Offer[]) => void;
  setRequests: (requests: Request[]) => void;
}

const OffersContext = createContext<OffersContextType | undefined>(undefined);

const STORAGE_KEY_OFFERS = 'marketplace_offers';
const STORAGE_KEY_REQUESTS = 'marketplace_requests';

export function OffersProvider({ children }: { children: ReactNode }) {
  const [offers, setOffers] = useState<Offer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OFFERS);
      return saved ? JSON.parse(saved).map((o: any) => ({
        ...o,
        createdAt: new Date(o.createdAt)
      })) : [];
    } catch {
      localStorage.removeItem(STORAGE_KEY_OFFERS);
      return [];
    }
  });
  
  const [requests, setRequests] = useState<Request[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
      return saved ? JSON.parse(saved).map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt)
      })) : [];
    } catch {
      localStorage.removeItem(STORAGE_KEY_REQUESTS);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  }, [requests]);

  const addOffer = useCallback((offer: Offer) => {
    setOffers(prev => {
      const updated = [offer, ...prev];
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addRequest = useCallback((request: Request) => {
    setRequests(prev => {
      const updated = [request, ...prev];
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateOffer = useCallback((id: string, updates: Partial<Offer>) => {
    setOffers(prev => prev.map(offer => 
      offer.id === id ? { ...offer, ...updates } : offer
    ));
  }, []);

  const updateRequest = useCallback((id: string, updates: Partial<Request>) => {
    setRequests(prev => prev.map(request => 
      request.id === id ? { ...request, ...updates } : request
    ));
  }, []);

  const deleteOffer = useCallback((id: string) => {
    setOffers(prev => {
      const updated = prev.filter(offer => offer.id !== id);
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteRequest = useCallback(async (id: string) => {
    await requestsAPI.deleteRequest(id);
    setRequests(prev => {
      const updated = prev.filter(request => request.id !== id);
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshOffers = useCallback(() => {
    localStorage.removeItem('cached_offers');
    window.dispatchEvent(new Event('offers-updated'));
  }, []);

  const setOffersCb = useCallback((newOffers: Offer[]) => {
    setOffers(newOffers);
  }, []);

  const setRequestsCb = useCallback((newRequests: Request[]) => {
    setRequests(newRequests);
  }, []);

  return (
    <OffersContext.Provider
      value={{
        offers,
        requests,
        addOffer,
        addRequest,
        updateOffer,
        updateRequest,
        deleteOffer,
        deleteRequest,
        refreshOffers,
        setOffers: setOffersCb,
        setRequests: setRequestsCb,
      }}
    >
      {children}
    </OffersContext.Provider>
  );
}

export function useOffers() {
  const context = useContext(OffersContext);
  if (context === undefined) {
    throw new Error('useOffers must be used within OffersProvider');
  }
  return context;
}