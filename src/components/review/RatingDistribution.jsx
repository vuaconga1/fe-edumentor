import React from 'react';
import { Star } from 'lucide-react';

/**
 * RatingDistribution - Displays rating breakdown with progress bars
 * Props:
 * - distribution: object with keys 1-5 and values as count
 * - totalReviews: number - total number of reviews
 */
const RatingDistribution = ({ distribution, totalReviews }) => {
  const ratings = [5, 4, 3, 2, 1];

  const getPercentage = (count) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  return (
    <div className="space-y-3">
      {ratings.map((star) => {
        const count = distribution[star] || 0;
        const percentage = getPercentage(count);

        return (
          <div key={star} className="flex items-center gap-3">
            {/* Star label */}
            <div className="flex items-center gap-1 w-12 text-sm font-medium text-gray-700 dark:text-gray-300">
              <span>{star}</span>
              <Star size={14} className="fill-amber-400 text-amber-400" />
            </div>

            {/* Progress bar */}
            <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>

            {/* Count */}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RatingDistribution;
