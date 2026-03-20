import type { Order } from '@/types/order';

export function isPassengerTransportOrder(order: Order): boolean {
  if (order.offerCategory === 'transport' && order.offerTransportServiceType?.toLowerCase().includes('пассажир')) return true;
  if (order.isRequest && order.buyerComment && /Время выезда:/i.test(order.buyerComment)) return true;
  return false;
}

export function isFreightTransportOrder(order: Order): boolean {
  return order.offerCategory === 'transport' && !!order.offerTransportServiceType?.toLowerCase().includes('груз');
}

export function getTransportDateTime(order: Order): string | null {
  if (order.offerTransportDateTime) return order.offerTransportDateTime;
  if (order.buyerComment) {
    const match = order.buyerComment.match(/Время выезда:\s*([^\n]+)/);
    if (match) return match[1].trim();
  }
  return null;
}

export function transportDatePassed(order: Order): boolean {
  const isTransport = isPassengerTransportOrder(order) || isFreightTransportOrder(order);
  if (!isTransport) return true;
  const dt = getTransportDateTime(order);
  if (!dt) return false;
  return new Date(dt) <= new Date();
}

interface OrderRoles {
  buyer: string;
  seller: string;
  counterBuyer: string;
  counterSeller: string;
}

export function getOrderRoles(order: Order): OrderRoles {
  if (order.isRequest) {
    const svc = order.offerTransportServiceType?.toLowerCase() || '';
    if (order.offerCategory === 'transport' && svc.includes('пассажир')) {
      return { buyer: 'Заказчик', seller: 'Исполнитель', counterBuyer: 'Заказчика', counterSeller: 'Исполнителя' };
    }
    return { buyer: 'Откликнулся', seller: 'Заказчик', counterBuyer: 'Откликнувшегося', counterSeller: 'Заказчика' };
  }

  if (order.offerCategory === 'transport') {
    const svc = order.offerTransportServiceType?.toLowerCase() || '';
    if (svc.includes('пассажир')) {
      return { buyer: 'Пассажир', seller: 'Исполнитель', counterBuyer: 'пассажира', counterSeller: 'исполнителя' };
    }
    if (svc.includes('груз')) {
      return { buyer: 'Заказчик', seller: 'Перевозчик', counterBuyer: 'заказчика', counterSeller: 'перевозчика' };
    }
    if (svc.includes('аренд')) {
      return { buyer: 'Арендатор', seller: 'Арендодатель', counterBuyer: 'арендатора', counterSeller: 'арендодателя' };
    }
    if (svc.includes('доставк')) {
      return { buyer: 'Отправитель', seller: 'Курьер', counterBuyer: 'отправителя', counterSeller: 'курьера' };
    }
    return { buyer: 'Клиент', seller: 'Исполнитель', counterBuyer: 'клиента', counterSeller: 'исполнителя' };
  }

  return { buyer: 'Покупатель', seller: 'Продавец', counterBuyer: 'покупателя', counterSeller: 'продавца' };
}