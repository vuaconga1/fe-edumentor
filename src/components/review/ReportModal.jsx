import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Check } from 'lucide-react';

const ReportModal = ({ isOpen, onClose, reviewId, onSubmit, loading: externalLoading }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({ reviewId, reason, details });
      setReason('');
      setDetails('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || externalLoading;

  const reportReasons = [
    { value: 'spam', label: 'Spam or advertisement' },
    { value: 'inappropriate', label: 'Inappropriate/Offensive content' },
    { value: 'fake', label: 'Misleading information/Fake review' },
    { value: 'privacy', label: 'Privacy violation' },
    { value: 'other', label: 'Other reason' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-red-50 dark:bg-red-900/10">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <Flag size={20} />
            <h3 className="font-bold text-lg">Report Review</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:bg-white dark:hover:bg-neutral-800 hover:text-neutral-500 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Warning Note */}
          <div className="flex gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl text-sm text-neutral-500 dark:text-neutral-300">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p>This report will be sent to the admin team for review. Please select the accurate reason.</p>
          </div>

          {/* Dropdown Reason */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Report Reason <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full appearance-none bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
              >
                <option value="" disabled>Select reason...</option>
                {reportReasons.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {/* Custom Arrow */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Details Textarea */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Additional details (Optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={3}
              className="w-full bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 text-neutral-900 dark:text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 text-sm font-semibold text-neutral-500 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || isLoading}
              className={`flex-1 py-3 text-sm font-semibold text-white rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all
                ${!reason || isLoading 
                  ? 'bg-neutral-300 dark:bg-neutral-800 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700 active:scale-95'
                }`}
            >
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ReportModal;
