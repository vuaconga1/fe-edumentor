import { useState, useEffect, useRef } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import axiosClient from '../../api/axios';

const REPORT_REASONS = [
  'Spam or misleading',
  'Harassment or bullying',
  'Inappropriate content',
  'Hate speech',
  'Violence or threats',
  'Intellectual property violation',
  'Scam or fraud',
  'Other',
];

const ReportPostModal = ({ isOpen, onClose, post }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const modalRef = useRef(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setDetails('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  // Close on clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Please select a reason.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const postTitle = post?.title || 'Untitled';
      const postId = post?.id;
      const authorId = post?.author?.id;

      await axiosClient.post('/api/User/reports', {
        reportedUserId: authorId,
        reason: selectedReason,
        details: `[Community Post #${postId}: "${postTitle}"] ${details}`.trim(),
      });

      setSuccess(true);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit report. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-lg shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Report Post</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          /* Success state */
          <div className="px-5 py-8 text-center">
            <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <Flag className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Report submitted</p>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mb-5">
              We'll review this report shortly. Thank you.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Post info */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-gray-500 dark:text-neutral-400">Post by</span>
              <span className="font-medium text-gray-800 dark:text-neutral-200 truncate">
                {post?.author?.name || 'Unknown'}
              </span>
              {post?.title && (
                <span className="text-gray-400 dark:text-neutral-500 truncate hidden sm:inline">— {post.title}</span>
              )}
            </div>

            {/* Reason dropdown */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => { setSelectedReason(e.target.value); setError(''); }}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm text-gray-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Details */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                Details <span className="text-xs font-normal text-gray-400 dark:text-neutral-500">(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Provide more context..."
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white resize-none placeholder-gray-400 dark:placeholder-neutral-500"
              />
              <p className="text-xs text-gray-400 dark:text-neutral-500 text-right">{details.length}/500</p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-1 border-t border-gray-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedReason}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportPostModal;
