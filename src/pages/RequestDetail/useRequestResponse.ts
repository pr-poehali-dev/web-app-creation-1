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
        await fetch('https://functions.poehali.dev/a2f5cfb9-ceec-46de-b675-2174dc5241a7', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData)
        });
      } catch (error) {
        console.error('Ошибка отправки Email уведомления:', error);
      }

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

      setIsResponseModalOpen(false);
      toast.success('Отклик успешно отправлен!', {
        description: 'Автор запроса свяжется с вами в ближайшее время'
      });
    } catch (error) {
      console.error('Ошибка отправки отклика:', error);
      toast.error('Не удалось отправить отклик', {
        description: 'Попробуйте позже'
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