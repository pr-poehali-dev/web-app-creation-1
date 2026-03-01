export interface OrderDetail {
  id: string;
  order_number?: string;
  orderNumber?: string;
  title: string;
  status: string;
  buyer_name?: string;
  buyerName?: string;
  buyer_phone?: string;
  buyerPhone?: string;
  buyer_email?: string;
  buyerEmail?: string;
  buyer_company?: string;
  buyerCompany?: string;
  seller_name?: string;
  sellerName?: string;
  seller_phone?: string;
  sellerPhone?: string;
  seller_email?: string;
  sellerEmail?: string;
  quantity: number;
  unit: string;
  price_per_unit?: number;
  pricePerUnit?: number;
  total_amount?: number;
  totalAmount?: number;
  counter_price_per_unit?: number;
  counterPricePerUnit?: number;
  counter_total_amount?: number;
  counterTotalAmount?: number;
  counter_offer_message?: string;
  counterOfferMessage?: string;
  delivery_type?: string;
  deliveryType?: string;
  delivery_address?: string;
  deliveryAddress?: string;
  buyer_comment?: string;
  buyerComment?: string;
  cancellation_reason?: string;
  cancellationReason?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  completed_date?: string;
  completedDate?: string;
  attachments?: { url: string; name: string }[];
}

export interface Message {
  id: string;
  sender_name?: string;
  senderName?: string;
  sender_id?: number | string;
  senderId?: number | string;
  message: string;
  created_at?: string;
  createdAt?: string;
  timestamp?: string;
  attachments?: { url: string; name?: string; type?: string }[];
  is_read?: boolean;
}

export const STATUS_MAP: Record<string, { label: string; color: string }> = {
  new: { label: 'Новый', color: 'bg-blue-100 text-blue-800' },
  pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-800' },
  negotiating: { label: 'Переговоры', color: 'bg-orange-100 text-orange-800' },
  accepted: { label: 'В работе', color: 'bg-green-100 text-green-800' },
  awaiting_payment: { label: 'Ждёт оплаты', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Завершён', color: 'bg-blue-100 text-blue-800' },
  rejected: { label: 'Отклонён', color: 'bg-red-100 text-red-800' },
  cancelled: { label: 'Отменён', color: 'bg-red-100 text-red-700' },
  archived: { label: 'Архив', color: 'bg-gray-100 text-gray-600' },
};

export function normalizeOrder(o: Record<string, unknown>): OrderDetail {
  return {
    id: o.id as string,
    order_number: (o.order_number || o.orderNumber) as string,
    orderNumber: (o.orderNumber || o.order_number) as string,
    title: (o.title || o.offer_title) as string,
    status: o.status as string,
    buyer_name: (o.buyer_name || o.buyerName || o.buyer_full_name) as string,
    buyerName: (o.buyerName || o.buyer_name || o.buyer_full_name) as string,
    buyer_phone: (o.buyer_phone || o.buyerPhone) as string,
    buyerPhone: (o.buyerPhone || o.buyer_phone) as string,
    buyer_email: (o.buyer_email || o.buyerEmail) as string,
    buyerEmail: (o.buyerEmail || o.buyer_email) as string,
    buyer_company: (o.buyer_company || o.buyerCompany) as string,
    buyerCompany: (o.buyerCompany || o.buyer_company) as string,
    seller_name: (o.seller_name || o.sellerName || o.seller_full_name) as string,
    sellerName: (o.sellerName || o.seller_name || o.seller_full_name) as string,
    seller_phone: (o.seller_phone || o.sellerPhone) as string,
    sellerPhone: (o.sellerPhone || o.seller_phone) as string,
    seller_email: (o.seller_email || o.sellerEmail) as string,
    sellerEmail: (o.sellerEmail || o.seller_email) as string,
    quantity: o.quantity as number,
    unit: o.unit as string,
    price_per_unit: (o.price_per_unit ?? o.pricePerUnit) as number,
    pricePerUnit: (o.pricePerUnit ?? o.price_per_unit) as number,
    total_amount: (o.total_amount ?? o.totalAmount) as number,
    totalAmount: (o.totalAmount ?? o.total_amount) as number,
    counter_price_per_unit: (o.counter_price_per_unit ?? o.counterPricePerUnit) as number,
    counterPricePerUnit: (o.counterPricePerUnit ?? o.counter_price_per_unit) as number,
    counter_total_amount: (o.counter_total_amount ?? o.counterTotalAmount) as number,
    counterTotalAmount: (o.counterTotalAmount ?? o.counter_total_amount) as number,
    counter_offer_message: (o.counter_offer_message || o.counterOfferMessage) as string,
    counterOfferMessage: (o.counterOfferMessage || o.counter_offer_message) as string,
    delivery_type: (o.delivery_type || o.deliveryType) as string,
    deliveryType: (o.deliveryType || o.delivery_type) as string,
    delivery_address: (o.delivery_address || o.deliveryAddress) as string,
    deliveryAddress: (o.deliveryAddress || o.delivery_address) as string,
    buyer_comment: (o.buyer_comment || o.buyerComment) as string,
    buyerComment: (o.buyerComment || o.buyer_comment) as string,
    cancellation_reason: (o.cancellation_reason || o.cancellationReason) as string,
    cancellationReason: (o.cancellationReason || o.cancellation_reason) as string,
    created_at: (o.created_at || o.createdAt) as string,
    createdAt: (o.createdAt || o.created_at) as string,
    updated_at: (o.updated_at || o.updatedAt) as string,
    updatedAt: (o.updatedAt || o.updated_at) as string,
    completed_date: (o.completed_date || o.completedDate) as string,
    completedDate: (o.completedDate || o.completed_date) as string,
    attachments: o.attachments as { url: string; name: string }[],
  };
}

export function formatDate(val?: string | null) {
  if (!val) return '—';
  try {
    return new Date(val).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return val;
  }
}

export function formatMoney(val?: number | null) {
  if (val == null) return '—';
  return Number(val).toLocaleString('ru-RU') + ' ₽';
}

export function isImage(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(url);
}

export function isVideo(url: string) {
  return /\.(mp4|webm|mov|avi|mkv)/i.test(url);
}
