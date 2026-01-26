import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

const BalanceCard = ({ balance, onDeposit, onWithdraw }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  return (
    // Main container with dark blue background
    <div className="relative w-full h-full min-h-[220px] bg-blue-900 rounded-3xl p-6 shadow-2xl overflow-hidden text-white flex flex-col justify-between group">
      {/* --- DECORATIVE PATTERN --- */}
      {/* 1. Large light blue spot top left */}
      <div className="absolute -top-20 -left-20 w-60 h-60 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
      {/* 2. Dark blue spot bottom right */}
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-700 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      {/* 3. Subtle noise/texture overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      {/* 4. Geometric circle decorations */}
      <div className="absolute top-10 right-10 w-20 h-20 border border-white/10 rounded-full"></div>
      <div className="absolute top-4 right-16 w-32 h-32 border border-white/5 rounded-full"></div>
      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1 opacity-90">
          <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg">
            <Wallet size={16} className="text-white" />
          </div>
          <span className="text-sm font-medium tracking-wide">Available Balance</span>
        </div>
        <div className="mt-4">
          <h2 className="text-4xl font-bold tracking-tight drop-shadow-sm">
            {formatCurrency(balance)}
          </h2>
        </div>
      </div>
      {/* --- BUTTONS --- */}
      <div className="relative z-10 grid grid-cols-2 gap-4 mt-6">
        <button
          onClick={onDeposit}
          className="flex items-center justify-center gap-2 bg-white text-blue-900 hover:bg-blue-50 py-3 rounded-2xl font-bold transition-transform active:scale-95 shadow-lg"
        >
          <ArrowDownLeft size={18} />
          <span>Deposit</span>
        </button>
        <button
          onClick={onWithdraw}
          className="flex items-center justify-center gap-2 bg-blue-800/40 border border-white/20 text-white hover:bg-blue-800/60 py-3 rounded-2xl font-semibold backdrop-blur-md transition-transform active:scale-95"
        >
          <ArrowUpRight size={18} />
          <span>Withdraw</span>
        </button>
      </div>
    </div>
  );
};

export default BalanceCard;
