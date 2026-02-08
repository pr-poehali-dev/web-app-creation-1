import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '@/services/api';
import { toast } from 'sonner';
import { getSession } from '@/utils/auth';
import type { Request } from './useRequestData';

export function useRequestResponse(request: Request | null, isAuthenticated: boolean) {
  const navigate = useNavigate();
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  const handleResponseClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const currentUser = getSession();
    const isOwner = currentUser && request && currentUser.id?.toString() === request.author.id?.toString();
    
    if (isOwner) {
      navigate(`/edit-request/${request?.id}?edit=true`);
      return;
    }
    
    setIsResponseModalOpen(true);
  };

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!request) return;
    
    const session = getSession();
    if (!session) {
      toast.error('Необходима авторизация');
      navigate('/login');
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const responseQuantity = parseFloat(formData.get('response-quantity') as string);
    const responsePrice = parseFloat(formData.get('response-price') as string);
    const deliveryTime = parseInt(formData.get('response-delivery') as string);
    const comment = formData.get('response-comment') as string;

    try {
      const orderData = {
        offerId: request.id,
        title: request.title,
        quantity: responseQuantity,
        unit: request.unit,
        pricePerUnit: responsePrice,
        hasVAT: request.hasVAT,
        vatRate: request.vatRate,
        deliveryType: 'delivery',
        deliveryAddress: request.deliveryAddress,
        district: request.district,
        buyerName: `${session.firstName} ${session.lastName}`,
        buyerPhone: session.phone || '',
        buyerEmail: session.email || '',
        buyerComment: `Срок поставки: ${deliveryTime} дней. ${comment || ''}`,
      };

      const result = await ordersAPI.createOrder(orderData);

      const notificationData = {
        userId: request.author.id,
        title: 'Новый отклик на запрос',
        message: `${session.firstName} ${session.lastName} откликнулся на "${request.title}"`,
        url: `/my-orders?id=${result.id}`
      };

      try {
        await fetch('https://functions.poehali.dev/d49f8584-6ef9-47c0-9661-02560166e10f', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData)
        });
      } catch (error) {
        console.error('Ошибка отправки Telegram уведомления:', error);
      }

      // Уведомляем dataSync о новом заказе
      const { notifyOrderUpdated } = await import('@/utils/dataSync');
      notifyOrderUpdated(result.id);
      
      setIsResponseModalOpen(false);
      toast.success('Отклик успешно отправлен!', {
        description: 'Автор запроса свяжется с вами в ближайшее время'
      });
    } catch (error: any) {
      console.error('Ошибка отправки отклика:', error);
      const errorMessage = error?.message || error?.toString() || 'Неизвестная ошибка';
      toast.error('Не удалось отправить отклик', {
        description: errorMessage
      });
    }
  };

  return {
    isResponseModalOpen,
    setIsResponseModalOpen,
    handleResponseClick,
    handleResponseSubmit,
  };
}