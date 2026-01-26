import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

const ReviewModal = ({ isOpen, onClose, order, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);

  if (!isOpen || !order) return null;

  const handleSubmit = () => {
    onSubmit({ orderId: order.id, rating, comment });
    onClose();
    setRating(5);
    setComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Mentoring Session</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center mb-8">
            <div className="relative inline-block mx-auto mb-3">
               <img src={order.mentor.avatar} alt="Mentor" className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg" />
               <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white">Mentor</div>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{order.mentor.name}</h4>
            <p className="text-sm text-slate-500">{order.service}</p>
          </div>

          <div className="flex justify-center gap-3 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 hover:-translate-y-1 focus:outline-none"
              >
                <Star
                  size={36}
                  className={`${
                    star <= (hoveredStar || rating)
                      ? 'fill-amber-400 text-amber-400 drop-shadow-md'
                      : 'fill-slate-100 text-slate-200 dark:fill-slate-800 dark:text-slate-700'
                  } transition-all duration-200`}
                />
              </button>
            ))}
          </div>

          <div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience? Please share..."
              rows={4}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm transition-all"
            ></textarea>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors">
            Later
          </button>
          <button onClick={handleSubmit} className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95">
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;