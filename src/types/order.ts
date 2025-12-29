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
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  counterPricePerUnit?: number;
  counterTotalAmount?: number;
  counterOfferMessage?: string;
  counterOfferedAt?: Date;
  counterOfferedBy?: 'buyer' | 'seller';
  buyerAcceptedCounter?: boolean;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  comment?: string;
  status: 'new' | 'pending' | 'accepted' | 'rejected' | 'completed' | 'negotiating';
  createdAt: Date;
  acceptedAt?: Date;
  completedDate?: Date;
  type?: 'purchase' | 'sale';
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