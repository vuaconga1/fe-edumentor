// src/components/proposal/SendProposalModal.jsx
import React, { useState, useEffect } from 'react';
import { HiX, HiCurrencyDollar, HiClock, HiPaperAirplane } from 'react-icons/hi';
import requestApi from '../../api/requestApi';

const SendProposalModal = ({ isOpen, onClose, post, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [hasPendingProposal, setHasPendingProposal] = useState(false);
  const [formData, setFormData] = useState({
    price: '',
    estimatedHours: '',
    message: '',
  });

  const isPendingStatus = (status) => {
    if (typeof status === 'number') {
      return status === 0; // Pending status
    }
    const normalized = String(status || '').toLowerCase();
    return normalized === 'pending' || normalized === 'open';
  };

  const checkExistingProposal = async () => {
    if (!post?.id) return false;
    
    try {
      let page = 1;
      let totalPages = 1;

      do {
        const res = await requestApi.getMyProposals(page, 50);
        const data = res?.data?.data;
        const items = data?.items || [];
        totalPages = data?.totalPages || 1;

        const pending = items.some((proposal) => {
          const postIdMatch = proposal?.postId === post.id || proposal?.communityPostId === post.id;
          const statusCheck = isPendingStatus(proposal?.status);
          return postIdMatch && statusCheck;
        });

        if (pending) {
          return true;
        }
        page += 1;
      } while (page <= totalPages && page <= 5);

      return false;
    } catch (err) {
      console.error('Check existing proposal failed:', err);
      return false;
    }
  };

  // Check for pending proposals when modal opens
  useEffect(() => {
    const checkPending = async () => {
      if (!isOpen || !post?.id) return;
      
      setCheckingExisting(true);
      setHasPendingProposal(false);
      try {
        const pending = await checkExistingProposal();
        setHasPendingProposal(pending);
      } catch (err) {
        console.error('Check pending failed:', err);
      } finally {
        setCheckingExisting(false);
      }
    };

    checkPending();
  }, [isOpen, post?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.price) {
      setError('Please enter your proposed price');
      return;
    }
    if (!formData.message.trim()) {
      setError('Please enter a message to the student');
      return;
    }
    if (!post?.id) {
      setError('Post information is missing');
      return;
    }

    // Re-check pending before submit
    setLoading(true);
    setError('');

    try {
      const pending = await checkExistingProposal();
      if (pending) {
        setHasPendingProposal(true);
        setError('You already have a pending proposal for this post. Please wait for the student to respond.');
        setLoading(false);
        return;
      }

      const payload = {
        postId: post.id,
        price: Number(formData.price),
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : null,
        message: formData.message.trim(),
      };

      await requestApi.createProposal(payload);
      
      // Reset form
      setFormData({
        price: '',
        estimatedHours: '',
        message: '',
      });
      
      onSuccess?.();
      onClose();
    } catch (err) {
      console.log('Create proposal failed:', err);
      setError(err?.response?.data?.message || 'Failed to send proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Send Proposal
            </h2>
            {post && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                On: "{post.title || post.content?.substring(0, 50) + '...'}"
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {checkingExisting && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-sm flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Checking for existing proposals...
            </div>
          )}

          {hasPendingProposal && !checkingExisting && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm">
              ⚠️ You already have a pending proposal for this post. Please wait for the student to respond.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Price & Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <HiCurrencyDollar className="inline w-4 h-4 mr-1" />
                Your Price (VND) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="E.g.: 500000"
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <HiClock className="inline w-4 h-4 mr-1" />
                Estimated Hours
              </label>
              <input
                type="number"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                placeholder="E.g.: 5"
                min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              <HiPaperAirplane className="inline w-4 h-4 mr-1" />
              Your Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={4}
              placeholder="Introduce yourself and explain how you can help the student..."
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Info Note */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-sm">
            <p>
              <strong>Note:</strong> The student will review your proposal and can accept or reject it. 
              If accepted, you'll be connected via chat to discuss further details.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || checkingExisting || hasPendingProposal}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading || checkingExisting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {checkingExisting ? 'Checking...' : 'Sending...'}
                </>
              ) : (
                <>
                  <HiPaperAirplane className="w-4 h-4" />
                  Send Proposal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendProposalModal;
