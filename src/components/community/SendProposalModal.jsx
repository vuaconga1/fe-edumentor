import React, { useState, useEffect } from 'react';
import { X, Send, DollarSign, Clock, FileText } from 'lucide-react';
import requestApi from '../../api/requestApi';

const SendProposalModal = ({ isOpen, onClose, onSubmit, postTitle, authorName, postId }) => {
    const [formData, setFormData] = useState({
        message: '',
        price: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkingExisting, setCheckingExisting] = useState(false);
    const [hasPendingProposal, setHasPendingProposal] = useState(false);

    const isPendingStatus = (status) => {
        if (typeof status === 'number') {
            return status === 0; // Pending status
        }
        const normalized = String(status || '').toLowerCase();
        return normalized === 'pending' || normalized === 'open';
    };

    const checkExistingProposal = async () => {
        if (!postId) return false;
        
        try {
            let page = 1;
            let totalPages = 1;

            do {
                const res = await requestApi.getMyProposals(page, 50);
                const data = res?.data?.data;
                const items = data?.items || [];
                totalPages = data?.totalPages || 1;

                const pending = items.some((proposal) => {
                    const postIdMatch = proposal?.postId === postId || proposal?.communityPostId === postId;
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
            if (!isOpen || !postId) {
                setHasPendingProposal(false);
                return;
            }
            
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
    }, [isOpen, postId]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.message.trim()) {
            setError('Please enter a message');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Re-check pending before submit
            const pending = await checkExistingProposal();
            if (pending) {
                setHasPendingProposal(true);
                setError('You already have a pending proposal for this post. Please wait for the student to respond.');
                setLoading(false);
                return;
            }

            await onSubmit({
                message: formData.message.trim(),
                price: formData.price ? parseFloat(formData.price) : null
            });

            // Reset form
            setFormData({ message: '', price: '' });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send proposal. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-lg mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Send className="w-5 h-5 text-primary-600" />
                            Send Proposal
                        </h2>
                        <p className="text-sm text-neutral-500 mt-1">
                            To: {authorName} • {postTitle || 'Community Post'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
                            {error}
                        </div>
                    )}

                    {/* Message */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            <FileText className="w-4 h-4 inline mr-1" />
                            Your Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Introduce yourself and explain how you can help..."
                            disabled={hasPendingProposal || checkingExisting}
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            Price (VND)
                        </label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            placeholder="e.g., 500000"
                            min="0"
                            disabled={hasPendingProposal || checkingExisting}
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                    </div>

                    {/* Info text */}
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        The student will be notified of your proposal. If accepted, a chat conversation will be created.
                    </p>

                    {/* Actions */}
                    <div className="flex pt-2">
                        <button
                            type="submit"
                            disabled={loading || checkingExisting || hasPendingProposal || !formData.message.trim()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                        >
                            {loading || checkingExisting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {checkingExisting ? 'Checking...' : 'Sending...'}
                                </>
                            ) : (
                                <>
                                    <Send size={16} />
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
