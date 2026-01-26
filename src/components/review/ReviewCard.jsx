import React from 'react'; // Bỏ useState thừa
import { Star, Flag } from 'lucide-react';

const ReviewCard = ({ review, onReport }) => { // Thêm prop onReport
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="relative bg-white dark:bg-neutral-900 rounded-2xl p-5 md:p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 hover:shadow-md transition-all group">
      
      {/* Flag Icon - Gọi hàm onReport khi click */}
      <button
        onClick={() => onReport(review)} 
        className="absolute top-4 right-4 p-2 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Report violation"
      >
        <Flag size={18} />
      </button>

      {/* ... Phần còn lại của Card giữ nguyên ... */}
      <div className="flex items-start gap-4 mb-4">
        <img
          src={review.studentAvatar}
          alt={review.studentName}
          className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-800"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-neutral-900 dark:text-white text-base mb-1">
            {review.studentName}
          </h4>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
            {review.courseName}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              className={`${
                star <= review.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-neutral-200 text-neutral-200 dark:fill-neutral-700 dark:text-neutral-700'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          {formatDate(review.date)}
        </span>
      </div>

      <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed mb-4">
        {review.comment}
      </p>

      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full border border-blue-100 dark:border-blue-800"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
