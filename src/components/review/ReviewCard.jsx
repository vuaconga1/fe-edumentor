import React from 'react';
import { Star, Flag } from 'lucide-react';
import { buildDefaultAvatarUrl } from '../../utils/avatar';

const ReviewCard = ({ review, onReport }) => {
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const utc = dateString.endsWith?.('Z') ? dateString : dateString + 'Z';
    return new Date(utc).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={`relative p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors group ${onReport ? 'pr-12 sm:pr-14' : ''}`}>
      
      {/* Flag Icon - Report button */}
      {onReport && (
        <button
          onClick={() => onReport(review)} 
          className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Report violation"
        >
          <Flag size={16} />
        </button>
      )}

      {/* Mobile & Desktop Layout */}
      <div className="flex items-start gap-3">
        <img
          src={review.studentAvatar || buildDefaultAvatarUrl({ fullName: review.studentName })}
          alt={review.studentName}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = buildDefaultAvatarUrl({ fullName: review.studentName });
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h4 className="font-medium text-gray-800 dark:text-white text-sm truncate">
                {review.studentName}
              </h4>
              <p className="text-xs text-gray-500 truncate">
                {review.courseName}
              </p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatDate(review.date)}
            </span>
          </div>

          <div className="flex items-center gap-0.5 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                className={`${
                  star <= review.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-200 text-gray-200 dark:fill-neutral-700 dark:text-neutral-700'
                }`}
              />
            ))}
          </div>

          {review.comment && (
            <p className="text-gray-600 dark:text-neutral-300 text-sm leading-relaxed">
              {review.comment}
            </p>
          )}

          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {review.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
