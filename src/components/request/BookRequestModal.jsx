// src/components/request/BookRequestModal.jsx
import React, { useState, useEffect } from 'react';
import { HiX, HiCurrencyDollar, HiClock, HiDocumentText } from 'react-icons/hi';
import requestApi from '../../api/requestApi';

const BookRequestModal = ({ isOpen, onClose, mentor, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expectedBudget: '',
    expectedHours: '',
  });

  const isPendingStatus = (status) => {
    if (typeof status === 'number') {
      return status === 0;
    }
    const normalized = String(status || '').toLowerCase();
    return normalized === 'open' || normalized === 'pending' || normalized === 'processing';
  };

  const hasPendingForMentor = async (mentorId, mentorName) => {

    let page = 1;
    let totalPages = 1;

    do {
      const res = await requestApi.getMyRequests(page, 50);
      const data = res?.data?.data;
      const items = data?.items || [];
      totalPages = data?.totalPages || 1;



      const pending = items.some((req) => {
        const statusCheck = isPendingStatus(req?.status);
        // Check if title contains mentor name (since backend doesn't return mentorId)
        const titleCheck = req?.title && mentorName && 
          req.title.toLowerCase().includes(mentorName.toLowerCase());

        return titleCheck && statusCheck;
      });
      
      if (pending) {

        return true;
      }
      page += 1;
    } while (page <= totalPages && page <= 5);


    return false;
  };

  // Pre-fill with mentor info when modal opens + check pending requests
  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!mentor?.id) return;
      setCheckingExisting(true);
      try {
        const mentorName = mentor.name || mentor.fullName || '';
        const pending = await hasPendingForMentor(mentor.id, mentorName);
        setHasPendingRequest(pending);
      } catch (err) {

        setHasPendingRequest(false);
      } finally {
        setCheckingExisting(false);
      }
    };

    if (isOpen) {
      if (mentor) {
        setFormData(prev => ({
          ...prev,
          title: `Request for ${mentor.name || mentor.fullName || 'Mentor'}`,
          expectedBudget: mentor.hourlyRate || '',
        }));
      }
      setHasPendingRequest(false);
      checkExistingRequest();
    }
  }, [isOpen, mentor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!formData.description.trim()) {
      setError('Please enter a detailed description');
      return;
    }
    if (!mentor?.id) {
      setError('Mentor information is missing');
      return;
    }
    

    try {
      setCheckingExisting(true);
      const mentorName = mentor.name || mentor.fullName || '';
      const pending = await hasPendingForMentor(mentor.id, mentorName);

      setHasPendingRequest(pending);
      if (pending) {

        setError('You already have a pending request with this mentor. Please wait for accept/reject.');
        return;
      }
    } catch (err) {

      // Don't return here - maybe we should block on error too?
    } finally {
      setCheckingExisting(false);
    }


    setLoading(true);
    setError('');

    try {
      const payload = {
        mentorId: mentor.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        expectedBudget: formData.expectedBudget ? Number(formData.expectedBudget) : null,
        expectedHours: formData.expectedHours ? Number(formData.expectedHours) : null,
      };

      await requestApi.create(payload);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        expectedBudget: '',
        expectedHours: '',
      });
      
      onSuccess?.();
      onClose();
    } catch (err) {

      setError(err?.response?.data?.message || 'Failed to create request. Please try again.');
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
              Send Request to Mentor
            </h2>
            {mentor && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                {mentor.name || mentor.fullName}
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
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          {hasPendingRequest && !error && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm">
              You already have a pending request with this mentor. Please wait for accept/reject.
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              <HiDocumentText className="inline w-4 h-4 mr-1" />
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="E.g.: Need help learning React JS"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe in detail what you need the mentor to help with..."
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Budget & Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <HiCurrencyDollar className="inline w-4 h-4 mr-1" />
                Budget (VND)
              </label>
              <input
                type="number"
                name="expectedBudget"
                value={formData.expectedBudget}
                onChange={handleChange}
                placeholder="E.g.: 500000"
                min="0"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <HiClock className="inline w-4 h-4 mr-1" />
                Expected Hours
              </label>
              <input
                type="number"
                name="expectedHours"
                value={formData.expectedHours}
                onChange={handleChange}
                placeholder="E.g.: 5"
                min="1"
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Info Note */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-sm">
            <p>
              <strong>Note:</strong> After you send this request, the mentor can accept or reject it. 
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
              disabled={loading || checkingExisting || hasPendingRequest}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading || checkingExisting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  {checkingExisting ? 'Checking...' : 'Sending...'}
                </>
              ) : (
                'Send Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookRequestModal;
