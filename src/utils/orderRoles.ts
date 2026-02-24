import type { Order } from '@/types/order';

interface OrderRoles {
  buyer: string;
  seller: string;
  counterBuyer: string;
  counterSeller: string;
}

export function getOrderRoles(order: Order): OrderRoles {
  if (order.isRequest) {
    return { buyer: 'Заказчик', seller: 'Исполнитель', counterBuyer: 'Заказчика', counterSeller: 'Исполнителя' };
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
