import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Offer, Request } from '@/types/offer';

interface OffersContextType {
  offers: Offer[];
  requests: Request[];
  addOffer: (offer: Offer) => void;
  addRequest: (request: Request) => void;
  updateOffer: (id: string, updates: Partial<Offer>) => void;
  updateRequest: (id: string, updates: Partial<Request>) => void;
  deleteOffer: (id: string) => void;
  deleteRequest: (id: string) => void;
}

const OffersContext = createContext<OffersContextType | undefined>(undefined);

const STORAGE_KEY_OFFERS = 'marketplace_offers';
const STORAGE_KEY_REQUESTS = 'marketplace_requests';

export function OffersProvider({ children }: { children: ReactNode }) {
  const [offers, setOffers] = useState<Offer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_OFFERS);
    return saved ? JSON.parse(saved).map((o: any) => ({
      ...o,
      createdAt: new Date(o.createdAt)
    })) : [];
  });
  
  const [requests, setRequests] = useState<Request[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
    return saved ? JSON.parse(saved).map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt)
    })) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(offers));
  }, [offers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(requests));
  }, [requests]);

  const addOffer = (offer: Offer) => {
    setOffers(prev => {
      const updated = [offer, ...prev];
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));
      return updated;
    });
  };

  const addRequest = (request: Request) => {
    setRequests(prev => {
      const updated = [request, ...prev];
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
      return updated;
    });
  };

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setOffers(prev => prev.map(offer => 
      offer.id === id ? { ...offer, ...updates } : offer
    ));
  };

  const updateRequest = (id: string, updates: Partial<Request>) => {
    setRequests(prev => prev.map(request => 
      request.id === id ? { ...request, ...updates } : request
    ));
  };

  const deleteOffer = (id: string) => {
    setOffers(prev => {
      const updated = prev.filter(offer => offer.id !== id);
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteRequest = (id: string) => {
    setRequests(prev => {
      const updated = prev.filter(request => request.id !== id);
      localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(updated));
      return updated;
    });
  };

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