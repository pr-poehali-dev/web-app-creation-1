import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useOffers } from '@/contexts/OffersContext';
import { requestsAPI } from '@/services/api';
import { markDataAsUpdated } from '@/utils/smartCache';

interface FormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  hasVAT: boolean;
  vatRate: string;
  district: string;
  deliveryAddress: string;
  availableDistricts: string[];
  deadlineStart: string;
  deadlineEnd: string;
  negotiableDeadline: boolean;
  budget: string;
  negotiableBudget: boolean;
  transportServiceType: string;
  transportRoute: string;
  transportType: string;
  transportCapacity: string;
  transportDateTime: string;
  transportDepartureDateTime: string;
  transportPrice: string;
  transportPriceType: string;
  transportNegotiable: boolean;
  transportComment: string;
  transportAllDistricts: boolean;
}

export function useCreateRequestSubmit(
  formData: FormData,
  imagePreviews: string[],
) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addRequest } = useOffers();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const buildRequestData = () => {
    const isDraft = false;
    const isService = formData.category === 'utilities';

    return {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory || undefined,
      quantity: parseFloat(formData.quantity) || 0,
      unit: formData.unit,
      pricePerUnit: parseFloat(formData.pricePerUnit) || 0,
      hasVAT: formData.hasVAT,
      vatRate: formData.hasVAT ? parseFloat(formData.vatRate) || 20 : undefined,
      district: formData.district,
      deliveryAddress: formData.deliveryAddress,
      availableDistricts: formData.availableDistricts,
      images: imagePreviews.map((url, index) => ({
        url,
        alt: `${formData.title} - изображение ${index + 1}`,
      })),
      isPremium: false,
      status: isDraft ? 'draft' : 'active',
      ...(isService && {
        deadlineStart: formData.deadlineStart || undefined,
        deadlineEnd: formData.deadlineEnd || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        negotiableDeadline: formData.negotiableDeadline,
        negotiableBudget: formData.negotiableBudget,
      }),
      ...(formData.category === 'transport' && {
        transportServiceType: formData.transportServiceType || undefined,
        transportRoute: formData.transportRoute || undefined,
        transportType: formData.transportType || undefined,
        transportCapacity: formData.transportCapacity || undefined,
        transportDateTime: formData.transportDateTime || undefined,
        transportDepartureDateTime: formData.transportDepartureDateTime || undefined,
        transportPrice: formData.transportPrice ? parseFloat(formData.transportPrice) : undefined,
        transportPriceType: formData.transportPriceType || undefined,
        transportNegotiable: formData.transportNegotiable,
        transportComment: formData.transportComment || undefined,
        transportAllDistricts: formData.transportAllDistricts,
      }),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requestData = buildRequestData();
      const result = await requestsAPI.createRequest(requestData);

      markDataAsUpdated('requests');
      localStorage.setItem('force_requests_reload', Date.now().toString());
      window.dispatchEvent(new Event('storage'));

      if (result && addRequest) {
        addRequest(result);
      }

      toast({
        title: 'Успешно',
        description: 'Запрос опубликован',
      });

      navigate('/zaprosy');
    } catch (error) {
      console.error('Ошибка создания запроса:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось создать запрос',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleSubmit };
}