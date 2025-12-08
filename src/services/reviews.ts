import type { Review, CreateReviewData, ReviewStats } from '@/types/review';
import func2url from '../../backend/func2url.json';

const REVIEWS_URL = func2url.reviews;

interface APIResponse {
  success: boolean;
  review?: Review;
  reviews?: Review[];
  stats?: ReviewStats;
  error?: string;
}

export const reviewsAPI = {
  async createReview(data: CreateReviewData): Promise<Review> {
    const response = await fetch(REVIEWS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create review');
    }

    const result: APIResponse = await response.json();
    if (!result.success || !result.review) {
      throw new Error(result.error || 'Failed to create review');
    }

    return result.review;
  },

  async getReviewsByUser(userId: string): Promise<Review[]> {
    const response = await fetch(`${REVIEWS_URL}?userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch reviews');
    }

    const result: APIResponse = await response.json();
    return result.reviews || [];
  },

  async getReviewStats(userId: string): Promise<ReviewStats> {
    const response = await fetch(`${REVIEWS_URL}?action=stats&userId=${userId}`);

    if (!response.ok) {
      throw new Error('Failed to fetch review stats');
    }

    const result: APIResponse = await response.json();
    if (!result.stats) {
      throw new Error('No stats found');
    }

    return result.stats;
  },

  async canReview(contractId: string): Promise<boolean> {
    const response = await fetch(`${REVIEWS_URL}?action=can-review&contractId=${contractId}`);

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result.canReview || false;
  },
};