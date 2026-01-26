import React from 'react';
import { Star } from 'lucide-react';
import RatingDistribution from './RatingDistribution';

/**
 * ReviewSummary - Displays overall rating summary and distribution
 * Props:
 * - averageRating: number - average rating (e.g., 4.9)
 * - totalReviews: number - total number of reviews
 * - distribution: object - rating distribution (1-5 stars)
 */
const ReviewSummary = ({ averageRating, totalReviews, distribution }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 shadow-md border border-neutral-200 dark:border-neutral-800">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Average Rating */}
        <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 pb-6 md:pb-0">
          <div className="text-6xl font-bold text-gray-900 dark:text-white mb-3">
            {averageRating.toFixed(1)}
          </div>
          
          {/* 5 Stars */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={24}
                className={`${
                  star <= Math.round(averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                }`}
              />
            ))}
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
            {totalReviews} reviews
          </p>
        </div>

        {/* Right: Rating Distribution */}
        <div className="flex flex-col justify-center">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">
            Rating Distribution
          </h3>
          <RatingDistribution distribution={distribution} totalReviews={totalReviews} />
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
