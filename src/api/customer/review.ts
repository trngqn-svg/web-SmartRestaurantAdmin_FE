import api from "../axios";

export type ListReviewsRes = {
  page: number;
  limit: number;
  total: number;
  summary: null | {
    itemId: string;
    itemName: string;
    ratingAvg: number;
    ratingCount: number;
    ratingBreakdown: Record<"1" | "2" | "3" | "4" | "5", number>;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    photoUrls: string[];
    createdAt: string;

    user: null | {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  }>;
};

export function adminGetItemReviews(
  itemId: string,
  params?: { page?: number; limit?: number; sort?: "latest" | "highest" | "lowest" }
) {
  return api
    .get<ListReviewsRes>(`/api/admin/menu/${itemId}/reviews`, { params })
    .then((r) => r.data);
}

export function adminDeleteReview(reviewId: string) {
  return api.delete(`/api/admin/item-reviews/${reviewId}`).then((r) => r.data);
}
