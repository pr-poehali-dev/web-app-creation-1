import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ordersAPI } from '@/services/api';
import { toast } from 'sonner';
import { getSession } from '@/utils/auth';
import type { Request } from './useRequestData';

export interface ExistingResponse {
  orderId: string;
  pricePerUnit: number;
  quantity: number;
  buyerComment: string;
  status: string;
  attachments: { url: string; name: string }[];
}

export function useRequestResponse(request: Request | null, isAuthenticated: boolean) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [existingResponse, setExistingResponse] = useState<ExistingResponse | null>(null);
  const [isCheckingResponse, setIsCheckingResponse] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const shouldAutoOpen = searchParams.get('editResponse') === 'true';

  useEffect(() => {
    if (!request || !isAuthenticated) return;
    const session = getSession();
    if (!session) return;
    const isOwner = session.id?.toString() === request.author.id?.toString();
    if (isOwner) return;

    setIsCheckingResponse(true);
    ordersAPI.checkExistingResponse(request.id)
      .then((data) => {
        if (data.exists && data.orderId) {
          setExistingResponse({
            orderId: data.orderId,
            pricePerUnit: data.pricePerUnit || 0,
            quantity: data.quantity || 1,
            buyerComment: data.buyerComment || '',
            status: data.status || 'new',
            attachments: data.attachments || [],
          });
          if (shouldAutoOpen) {
            setIsEditFormOpen(true);
          }
        } else {
          setExistingResponse(null);
        }
      })
      .catch(() => setExistingResponse(null))
      .finally(() => setIsCheckingResponse(false));
  }, [request, isAuthenticated]);

  const handleResponseClick = () => {
    if (!isAuthenticated) {
      localStorage.setItem('returnUrl', location.pathname);
      navigate('/login', { state: { returnUrl: location.pathname } });
      return;
    }
    
    const currentUser = getSession();
    const isOwner = currentUser && request && currentUser.id?.toString() === request.author.id?.toString();
    
    if (isOwner) {
      navigate(`/edit-request/${request?.id}?edit=true`);
      return;
    }
    
    if (existingResponse) {
      setIsEditFormOpen(true);
    } else {
      setIsResponseModalOpen(true);
    }
  };

  const handleResponseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!request) return;
    
    const session = getSession();
    if (!session) {
      toast.error('Необходима авторизация');
      localStorage.setItem('returnUrl', location.pathname);
      navigate('/login', { state: { returnUrl: location.pathname } });
      return;
    }

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const responseQuantity = parseFloat(formData.get('response-quantity') as string);
    const priceValue = formData.get('response-price-value') as string || formData.get('response-price') as string;
    const responsePrice = parseFloat(priceValue.replace(/\s/g, ''));
    const deliveryTime = parseInt(formData.get('response-delivery') as string);
    const comment = formData.get('response-comment') as string;
    const education = formData.get('response-education') as string;

    const educationPart = education?.trim() ? `Образование: ${education.trim()}\n` : '';

    const attachmentsInput = formData.get('response-attachments') as string;
    let attachments: { url: string; name: string }[] = [];
    if (attachmentsInput) {
      try { attachments = JSON.parse(attachmentsInput); } catch { /* ignore */ }
    }

    try {
      if (existingResponse) {
        await ordersAPI.updateResponse(existingResponse.orderId, {
          editResponse: true,
          pricePerUnit: responsePrice,
          quantity: responseQuantity || 1,
          buyerComment: `Срок поставки: ${deliveryTime} дней. ${educationPart}${comment || ''}`,
          attachments,
        });

        setExistingResponse({
          ...existingResponse,
          pricePerUnit: responsePrice,
          quantity: responseQuantity || 1,
          buyerComment: `Срок поставки: ${deliveryTime} дней. ${educationPart}${comment || ''}`,
          attachments,
        });

        setIsResponseModalOpen(false);
        setIsEditFormOpen(false);
        toast.success('Отклик обновлен!');
      } else {
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
          buyerComment: `Срок поставки: ${deliveryTime} дней. ${educationPart}${comment || ''}`,
          attachments,
        };

        const result = await ordersAPI.createOrder(orderData);

        setExistingResponse({
          orderId: result.id,
          pricePerUnit: responsePrice,
          quantity: responseQuantity || 1,
          buyerComment: `Срок поставки: ${deliveryTime} дней. ${educationPart}${comment || ''}`,
          status: 'new',
          attachments,
        });

        const notificationData = {
          userId: request.author.id,
          title: 'Новый отклик на запрос',
          message: `${session.firstName} ${session.lastName} откликнулся на "${request.title}"`,
          url: `/my-orders?tab=my-requests`
        };

        try {
          await fetch('https://functions.poehali.dev/d49f8584-6ef9-47c0-9661-02560166e10f', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notificationData)
          });
        } catch (error) {
          console.error('Telegram notification error:', error);
        }

        const { notifyOrderUpdated } = await import('@/utils/dataSync');
        notifyOrderUpdated(result.id);
        
        setIsResponseModalOpen(false);
        toast.success('Отклик успешно отправлен!', {
          description: 'Автор запроса свяжется с вами в ближайшее время'
        });
      }
    } catch (error: unknown) {
      console.error('Response error:', error);
      const errorMessage = (error as Error)?.message || String(error);
      
      if (errorMessage.includes('уже отправили отклик')) {
        toast.error('Вы уже откликнулись на этот запрос', {
          description: 'Нажмите "Редактировать отклик" для изменения'
        });
        ordersAPI.checkExistingResponse(request.id).then((data) => {
          if (data.exists && data.orderId) {
            setExistingResponse({
              orderId: data.orderId,
              pricePerUnit: data.pricePerUnit || 0,
              quantity: data.quantity || 1,
              buyerComment: data.buyerComment || '',
              status: data.status || 'new',
              attachments: data.attachments || [],
            });
          }
        });
      } else {
        toast.error('Не удалось отправить отклик', { description: errorMessage });
      }
    }
  };

  return {
    isResponseModalOpen,
    setIsResponseModalOpen,
    isEditFormOpen,
    setIsEditFormOpen,
    existingResponse,
    isCheckingResponse,
    handleResponseClick,
    handleResponseSubmit,
  };
}