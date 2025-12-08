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
    try {
      const response = await fetch(`${REVIEWS_URL}?userId=${userId}`);

      if (!response.ok) {
        console.error(`HTTP ${response.status} : ${REVIEWS_URL}?userId=${userId}`);
        return [];
      }

      const result: APIResponse = await response.json();
      return result.reviews || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  async getReviewStats(userId: string): Promise<ReviewStats> {
    try {
      const response = await fetch(`${REVIEWS_URL}?action=stats&userId=${userId}`);

      if (!response.ok) {
        console.error(`HTTP ${response.status} : ${REVIEWS_URL}?action=stats&userId=${userId}`);
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      const result: APIResponse = await response.json();
      if (!result.stats) {
        return {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
      }

      return result.stats;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
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