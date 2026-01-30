export interface Review {
  id: string | number;
  contractId?: string;
  orderId?: string;
  reviewerId: string | number;
  reviewedUserId: string | number;
  rating: number;
  title?: string;
  comment?: string;
  qualityRating?: number;
  deliveryRating?: number;
  communicationRating?: number;
  isVerifiedPurchase?: boolean;
  createdAt: Date | string;
  updatedAt?: Date | string;
  reviewerName?: string;
  reviewerType?: string;
  offerTitle?: string;
  sellerResponse?: string;
  sellerResponseDate?: Date | string;
  response?: ReviewResponse;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  qualityAverage?: number;
  deliveryAverage?: number;
  communicationAverage?: number;
}

export interface CreateReviewData {
  contractId?: string;
  orderId?: string;
  reviewedUserId?: string;
  seller_id?: number;
  order_id?: string;
  rating: number;
  title?: string;
  comment?: string;
  qualityRating?: number;
  deliveryRating?: number;
  communicationRating?: number;
}

export interface SellerResponseData {
  review_id: number;
  seller_response: string;
}