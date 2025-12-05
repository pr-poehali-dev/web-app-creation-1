import { createContext, useContext, useState, ReactNode } from 'react';
import type { Offer, Request } from '@/types/offer';
import { MOCK_OFFERS } from '@/data/mockOffers';
import { MOCK_REQUESTS } from '@/data/mockRequests';

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

export function OffersProvider({ children }: { children: ReactNode }) {
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [requests, setRequests] = useState<Request[]>(MOCK_REQUESTS);

  const addOffer = (offer: Offer) => {
    setOffers(prev => [offer, ...prev]);
  };

  const addRequest = (request: Request) => {
    setRequests(prev => [request, ...prev]);
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
    setOffers(prev => prev.filter(offer => offer.id !== id));
  };

  const deleteRequest = (id: string) => {
    setRequests(prev => prev.filter(request => request.id !== id));
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
