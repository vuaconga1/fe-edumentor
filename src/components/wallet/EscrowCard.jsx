import React from 'react';
import { Lock } from 'lucide-react';

const EscrowCard = ({ balance }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    <div className="relative h-full bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-blue-100 dark:border-gray-700 overflow-hidden flex flex-col justify-center shadow-sm hover:shadow-md transition-shadow">
      
      {/* --- DOT GRID PATTERN (background dots) --- */}
      {/* This is a CSS radial-gradient dot pattern */}
      <div 
        className="absolute inset-0 opacity-[0.4]"
        style={{
            backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)',
            backgroundSize: '20px 20px'
        }}
      ></div>

      {/* --- NỘI DUNG --- */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
            <Lock size={20} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Escrow
          </span>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(balance)}
        </h2>
        <p className="text-sm text-gray-500 mt-2 font-medium">
          Temporarily held pending completion
        </p>
      </div>

      {/* Decoration Line */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-transparent"></div>
    </div>
  );
};

export default EscrowCard;
