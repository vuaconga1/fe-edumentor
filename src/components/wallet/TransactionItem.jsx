import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

const TransactionItem = ({ transaction }) => {
  const { type, title, amount, time, status } = transaction;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Math.abs(val));
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
    });
  };

  // Use a single blue tone for icons
  const getIcon = () => {
    let Icon = Clock;
    // Topup = Down arrow (Deposit)
    if (type === 'topup') Icon = ArrowDownLeft;
    // Payment = Up arrow (Payment)
    else if (type === 'payment') Icon = ArrowUpRight;
    return (
      // Light blue background + dark blue icon for consistency
      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
        <Icon size={20} strokeWidth={2.5} />
      </div>
    );
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-2xl transition-all group border border-transparent hover:border-blue-100 dark:hover:border-neutral-700 cursor-default">
      <div className="flex items-center gap-4">
        {getIcon()}

        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {title}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <span>{formatTime(time)}</span>
            {status === 'processing' && (
              <span className="px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-md text-[10px]">Processing</span>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        {/* Amount: blue if positive, black/white if negative for simple palette */}
        <p className={`text-sm font-bold ${amount > 0 ? 'text-blue-600' : 'text-gray-900 dark:text-white'}`}>
          {amount > 0 ? '+' : '-'}{formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
};

export default TransactionItem;
