export interface Review {
  id: string;
  contractId: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  title: string;
  comment: string;
  qualityRating?: number;
  deliveryRating?: number;
  communicationRating?: number;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt?: Date;
  reviewerName?: string;
  reviewerType?: string;
  offerTitle?: string;
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
  contractId: string;
  reviewedUserId: string;
  rating: number;
  title: string;
  comment: string;
  qualityRating?: number;
  deliveryRating?: number;
  communicationRating?: number;
}
