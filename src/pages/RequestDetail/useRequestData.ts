import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsAPI } from '@/services/api';
import { toast } from 'sonner';
import { dataSync } from '@/utils/dataSync';

interface RequestImage {
  id: string;
  url: string;
  alt: string;
}

interface RequestVideo {
  id: string;
  url: string;
  thumbnail?: string;
}

interface Author {
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
    totalRequests: number;
    activeRequests: number;
    completedOrders: number;
    registrationDate: Date;
  };
}

export interface Request {
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
  deliveryAddress: string;
  district: string;
  availableDistricts: string[];
  images: RequestImage[];
  video?: RequestVideo;
  isPremium: boolean;
  author: Author;
  createdAt: Date;
  updatedAt: Date;
  expiryDate?: Date;
  viewsCount?: number;
  responsesCount?: number;
  deadlineStart?: string;
  deadlineEnd?: string;
  negotiableDeadline?: boolean;
  budget?: number;
  negotiableBudget?: boolean;
  transportServiceType?: string;
  transportRoute?: string;
  transportType?: string;
  transportCapacity?: string;
  transportDateTime?: string;
  transportPrice?: string;
  transportPriceType?: string;
  transportNegotiable?: boolean;
  transportComment?: string;
}

export function useRequestData(id: string | undefined) {
  const navigate = useNavigate();
  const [request, setRequest] = useState<Request | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const loadRequest = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await requestsAPI.getRequestById(id);
        const mappedRequest: Request = {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          subcategory: data.subcategory || '',
          quantity: data.quantity,
          unit: data.unit,
          pricePerUnit: data.pricePerUnit || 0,
          hasVAT: data.hasVAT,
          vatRate: data.vatRate,
          deliveryAddress: data.deliveryAddress || data.fullAddress || '',
          district: data.district,
          availableDistricts: data.availableDistricts || [data.district],
          images: data.images || [],
          video: data.video,
          isPremium: data.isPremium,
          author: {
            id: data.userId,
            name: data.authorName || 'Пользователь',
            type: 'individual',
            phone: '',
            email: '',
            rating: 0,
            reviewsCount: 0,
            isVerified: data.authorIsVerified || false,
            statistics: {
              totalRequests: 0,
              activeRequests: 0,
              completedOrders: 0,
              registrationDate: new Date(),
            },
          },
          createdAt: data.createdAt ? (data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt)) : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt)) : new Date(),
          expiryDate: data.expiryDate ? (data.expiryDate instanceof Date ? data.expiryDate : new Date(data.expiryDate)) : undefined,
          viewsCount: data.views,
          responsesCount: data.responses,
          deadlineStart: data.deadlineStart,
          deadlineEnd: data.deadlineEnd,
          negotiableDeadline: data.negotiableDeadline,
          budget: data.budget,
          negotiableBudget: data.negotiableBudget,
          transportServiceType: data.transportServiceType,
          transportRoute: data.transportRoute,
          transportType: data.transportType,
          transportCapacity: data.transportCapacity,
          transportDateTime: data.transportDateTime,
          transportPrice: data.transportPrice,
          transportPriceType: data.transportPriceType,
          transportNegotiable: data.transportNegotiable,
          transportComment: data.transportComment,
        };
        setRequest(mappedRequest);
        
        if (data.video) {
          setShowVideo(true);
        }
      } catch (error) {
        console.error('Error loading request:', error);
        toast.error('Не удалось загрузить запрос');
        navigate('/zaprosy');
      } finally {
        setIsLoading(false);
      }
    };

    loadRequest();
    
    const unsubscribe = dataSync.subscribe('request_updated', () => {
      console.log('Request updated, reloading request detail...');
      loadRequest();
    });
    
    return () => {
      unsubscribe();
    };
  }, [id, navigate]);

  return { request, isLoading, showVideo };
}