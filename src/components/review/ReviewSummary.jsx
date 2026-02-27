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
    <div className="bg-white dark:bg-neutral-900 rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-neutral-800">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Left: Average Rating */}
        <div className="flex flex-col items-center justify-center text-center border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-neutral-700 pb-5 sm:pb-0">
          <div className="text-4xl sm:text-5xl font-semibold text-gray-800 dark:text-white mb-2">
            {averageRating.toFixed(1)}
          </div>
          
          {/* 5 Stars */}
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={`${
                  star <= Math.round(averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200 dark:fill-neutral-700 dark:text-neutral-700'
                }`}
              />
            ))}
          </div>
          
          <p className="text-gray-500 text-sm">
            {totalReviews} reviews
          </p>
        </div>

        {/* Right: Rating Distribution */}
        <div className="flex flex-col justify-center">
          <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
            Rating Distribution
          </h3>
          <RatingDistribution distribution={distribution} totalReviews={totalReviews} />
        </div>
      </div>
    </div>
  );
};

export default ReviewSummary;
