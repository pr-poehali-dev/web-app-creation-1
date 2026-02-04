export interface Order {
  id: string;
  orderNumber?: string;
  offerId: string;
  offerTitle: string;
  offerImage?: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  quantity: number;
  originalQuantity?: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  offerAvailableQuantity?: number;
  offerPricePerUnit?: number;
  counterPricePerUnit?: number;
  counterTotalAmount?: number;
  counterOfferMessage?: string;
  counterOfferedAt?: Date;
  counterOfferedBy?: 'buyer' | 'seller';
  buyerAcceptedCounter?: boolean;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  comment?: string;
  status: 'new' | 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled' | 'negotiating';
  createdAt: Date;
  acceptedAt?: Date;
  completedDate?: Date;
  cancelledBy?: 'buyer' | 'seller';
  cancellationReason?: string;
  type?: 'purchase' | 'sale';
  buyerCompany?: string;
  buyerInn?: string;
  hasUnreadCounterOffer?: boolean; // Флаг непрочитанной встречной цены
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}