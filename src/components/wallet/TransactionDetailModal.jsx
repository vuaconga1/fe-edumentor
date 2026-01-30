import React from 'react';
import { X, ArrowUpRight, ArrowDownLeft, Clock, User } from 'lucide-react';
import { getRoleName } from '../../utils/userRole';
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from '../../utils/avatar';

const TransactionDetailModal = ({ isOpen, onClose, transaction }) => {
  if (!isOpen || !transaction) return null;

  const { type, title, amount, time, status, details } = transaction;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN').format(Math.abs(val));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'topup': return 'Deposit';
      case 'payment': return 'Payment';
      case 'escrow_hold': return 'Escrow Hold';
      case 'withdraw': return 'Withdrawal';
      default: return 'Transaction';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Transaction Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Amount Section */}
          <div className="text-center py-4">
            <p className="text-sm text-neutral-500 mb-1">{getTypeLabel()}</p>
            <p className={`text-3xl font-bold ${amount > 0 ? 'text-blue-600' : 'text-neutral-900 dark:text-white'}`}>
              {amount > 0 ? '+' : '-'}{formatCurrency(amount)} VND
            </p>
            <p className={`text-sm mt-2 ${
              status === 'completed' ? 'text-green-600' : 
              status === 'processing' ? 'text-amber-600' : 'text-neutral-500'
            }`}>
              {getStatusLabel()}
            </p>
          </div>

          {/* Details List */}
          <div className="space-y-3">
            {/* Transaction ID */}
            <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-sm text-neutral-500">Transaction ID</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white font-mono">
                TXN{transaction.id?.toString().padStart(8, '0')}
              </span>
            </div>

            {/* Date & Time */}
            <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-sm text-neutral-500">Date & Time</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white text-right">
                {formatDate(time)}
              </span>
            </div>

            {/* Description */}
            <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-sm text-neutral-500">Description</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-white text-right max-w-[200px]">
                {title}
              </span>
            </div>

            {/* Payment Method */}
            {details?.paymentMethod && (
              <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-sm text-neutral-500">Payment Method</span>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {details.paymentMethod}
                </span>
              </div>
            )}
          </div>

          {/* Counterparty */}
          {details?.counterparty && (
            <div className="pt-2">
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Transaction With</p>
              <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                {details.counterparty.isAnonymous ? (
                  <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                    <User size={20} className="text-neutral-500" />
                  </div>
                ) : (
                  <img
                    src={normalizeAvatarUrl(details.counterparty.avatarUrl || details.counterparty.avatar) || buildDefaultAvatarUrl({ id: details.counterparty.id, fullName: details.counterparty.name })}
                    alt={details.counterparty.name}
                    className="w-10 h-10 rounded-lg object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = buildDefaultAvatarUrl({ id: details.counterparty.id, fullName: details.counterparty.name });
                    }}
                  />
                )}
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white text-sm">
                    {details.counterparty.isAnonymous ? 'Anonymous User' : details.counterparty.name}
                  </p>
                  {!details.counterparty.isAnonymous && details.counterparty.role != null && (
                    <p className="text-xs text-neutral-500">{getRoleName(details.counterparty.role)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Order Details */}
          {details?.order && (
            <div className="pt-2">
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-3">Order Details</p>
              <div className="space-y-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Order ID</span>
                  <span className="font-medium text-neutral-900 dark:text-white font-mono">{details.order.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Service</span>
                  <span className="font-medium text-neutral-900 dark:text-white">{details.order.service}</span>
                </div>
                {details.order.duration && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Duration</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{details.order.duration}</span>
                  </div>
                )}
                {details.order.date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Session Date</span>
                    <span className="font-medium text-neutral-900 dark:text-white">{details.order.date}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Note */}
          {details?.note && (
            <div className="pt-2">
              <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Note</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                {details.note}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;
