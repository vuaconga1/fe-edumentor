import React, { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import orderApi from '../../api/orderApi';

const ViewReviewModal = ({ isOpen, onClose, order }) => {
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !order?.id) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const res = await orderApi.getOrderReviews(order.id);
        const reviews = res?.data?.data ?? res?.data ?? [];
        // Get the first review (student's review)
        if (mounted) {
          setReview(Array.isArray(reviews) && reviews.length > 0 ? reviews[0] : null);
        }
      } catch (e) {
        console.error('Load review failed:', e);
        if (mounted) setError('Failed to load review.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Review</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Mentor info */}
          <div className="text-center mb-6">
            <div className="relative inline-block mx-auto mb-3">
              <img
                src={order.mentor?.avatar}
                alt="Mentor"
                className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
              />
              <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white">
                Mentor
              </div>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{order.mentor?.name}</h4>
            <p className="text-sm text-slate-500">{order.service}</p>
          </div>

          {loading && (
            <div className="text-center py-8 text-slate-500">Loading review...</div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">{error}</div>
          )}

          {!loading && !error && review && (
            <>
              {/* Rating */}
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={32}
                    className={`${
                      star <= review.rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-slate-100 text-slate-200 dark:fill-slate-800 dark:text-slate-700'
                    }`}
                  />
                ))}
              </div>

              <p className="text-center text-sm text-slate-500 mb-6">
                {review.rating}/5 stars
              </p>

              {/* Comment */}
              {review.comment && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2 font-medium">Your Comment</p>
                  <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              )}

              {/* Date */}
              {review.createdAt && (
                <p className="text-center text-xs text-slate-400 mt-4">
                  Reviewed on {new Date(review.createdAt?.endsWith?.('Z') ? review.createdAt : review.createdAt + 'Z').toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </p>
              )}
            </>
          )}

          {!loading && !error && !review && (
            <div className="text-center py-8 text-slate-500">No review found.</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewReviewModal;
