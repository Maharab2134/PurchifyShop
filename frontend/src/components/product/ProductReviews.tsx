import { useState } from "react";
import {
  Star,
  MessageSquare,
  User,
  Clock,
  ThumbsUp,
  AlertCircle,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { reviewsApi } from "@/api/reviews";
import type { Review } from "@/api/reviews";

interface ProductReviewsProps {
  reviews: Review[];
  productId: string;
  onReviewAdded?: () => void;
}

export default function ProductReviews({
  reviews,
  productId,
  onReviewAdded,
}: ProductReviewsProps) {
  const { user, isAuthenticated } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [expandedReviews, setExpandedReviews] = useState<
    Record<string, boolean>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      setError("Please sign in to write a review");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await reviewsApi.create({
        productId,
        rating,
        comment: comment || undefined,
      });
      setRating(5);
      setComment("");
      if (onReviewAdded) onReviewAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleReviewExpansion = (reviewId: string) => {
    setExpandedReviews((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={16}
        className={
          index < rating
            ? "text-amber-400 fill-amber-400"
            : "text-gray-200 dark:text-gray-600"
        }
      />
    ));
  };

  const ratingLabels: Record<number, string> = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  const getRatingDistribution = () => {
    if (!reviews || reviews.length === 0) return null;
    const distribution = [0, 0, 0, 0, 0];
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating - 1]++;
      }
    });
    const total = reviews.length;
    return distribution
      .map((count) => ({
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .reverse();
  };

  const ratingDistribution = getRatingDistribution();
  const averageRating = reviews?.length
    ? (
        reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
      ).toFixed(1)
    : "0";

  if (submitting) {
    return (
      <div className="my-12 text-center flex justify-center items-center space-x-3">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-600 dark:border-indigo-400 rounded-full border-t-transparent"></div>
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          Submitting your review...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="border-b border-gray-200 dark:border-gray-600 pb-3 mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <MessageSquare
            className="mr-2 text-indigo-600 dark:text-indigo-400"
            size={20}
          />
          Customer Reviews
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
          <span className="sm:hidden">{reviews.length}</span>
          <span className="hidden sm:inline">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"} for
            this product
          </span>
        </p>
      </div>

      {reviews.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 sm:p-6 mb-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-semibold text-gray-800 dark:text-gray-100">
              {averageRating}
            </div>
            <div className="flex justify-center mt-1">
              {renderStars(Math.round(Number(averageRating)))}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mt-1">
              <span className="sm:hidden">Based on {reviews.length}</span>
              <span className="hidden sm:inline">
                Based on {reviews.length} reviews
              </span>
            </p>
          </div>
          <div className="flex-1 w-full">
            {ratingDistribution?.map((data, idx) => (
              <div
                key={idx}
                className="flex items-center mb-2 text-xs sm:text-sm"
              >
                <div className="w-12 text-right text-gray-700 dark:text-gray-300">
                  {5 - idx} stars
                </div>
                <div className="ml-2 flex-1">
                  <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 dark:bg-indigo-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="ml-2 w-10 text-gray-600 dark:text-gray-400">
                  {data.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAuthenticated && user ? (
        <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4 sm:p-6 mb-6 border border-gray-100 dark:border-gray-600">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
            <ThumbsUp
              className="mr-2 text-indigo-600 dark:text-indigo-400"
              size={18}
            />
            Write a Review
          </h3>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Rating
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => setRating(index + 1)}
                      className={`focus:outline-none transition-transform duration-150 ${
                        index < rating ? "scale-110" : ""
                      }`}
                    >
                      <Star
                        size={20}
                        className={`${index < rating ? "text-indigo-500 fill-indigo-500 dark:text-indigo-400 dark:fill-indigo-400" : "text-gray-300 dark:text-gray-500"}`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {rating} - {ratingLabels[rating]}
                </p>
              </div>
            </div>
            <div className="mb-4">
              <label
                htmlFor="comment"
                className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Your Review
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 text-xs sm:text-sm"
                placeholder="Share your experience with this product..."
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-indigo-600 dark:bg-indigo-500 text-white py-2 px-4 rounded-md font-medium text-xs sm:text-sm flex items-center hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={14} className="mr-2" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg p-4 mb-6 text-indigo-600 dark:text-indigo-400 flex items-center text-xs sm:text-sm">
          <AlertCircle size={16} className="mr-2" />
          Please log in to write a review.
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center">
          <User
            className="mr-2 text-indigo-600 dark:text-indigo-400"
            size={18}
          />
          Customer Feedback
        </h3>
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <MessageSquare
              size={32}
              className="mx-auto text-gray-400 dark:text-gray-500 mb-2"
            />
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
              No reviews yet. Be the first to share your thoughts!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border border-gray-100 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-11 h-11 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0">
                    {review.user?.name?.charAt(0)?.toUpperCase() || "A"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                        {review.user?.name || "Anonymous"}
                      </span>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock size={12} className="mr-1" />
                      {formatDistanceToNow(new Date(review.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                  {expandedReviews[review.id] ||
                  (review.comment?.length || 0) <= 200
                    ? review.comment
                    : `${review.comment?.slice(0, 200)}...`}
                  {(review.comment?.length || 0) > 200 && (
                    <button
                      onClick={() => toggleReviewExpansion(review.id)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-medium ml-2"
                    >
                      {expandedReviews[review.id] ? "Show less" : "Read more"}
                    </button>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
