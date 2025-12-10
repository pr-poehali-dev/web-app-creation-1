export interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderName: string;
  senderType: 'buyer' | 'seller';
  text: string;
  attachments?: ChatAttachment[];
  timestamp: Date;
  isRead: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface ChatThread {
  orderId: string;
  messages: ChatMessage[];
  participants: {
    buyer: {
      id: string;
      name: string;
    };
    seller: {
      id: string;
      name: string;
    };
  };
  unreadCount: number;
  lastMessageAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  offerId: string;
  offerTitle: string;
  offerImage?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  hasVAT: boolean;
  vatRate?: number;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: string;
  district: string;
  comment?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  chat?: ChatThread;
}

export interface Response {
  id: string;
  responseNumber: string;
  requestId: string;
  requestTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  deliveryDays: number;
  comment?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  chat?: ChatThread;
}
