import React, { useEffect, useState } from "react";
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Lock,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";

import DepositModal from "../../components/wallet/DepositModal";
import WithdrawModal from "../../components/wallet/WithdrawModal";
import TransactionDetailModal from "../../components/wallet/TransactionDetailModal";

import walletApi from "../../api/walletApi";

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showBalance, setShowBalance] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  const formatCurrency = (amount) => {
    if (amount == null || Number.isNaN(Number(amount))) return "—";
    return new Intl.NumberFormat("vi-VN").format(Number(amount));
  };

  const formatTime = (dateString) => {
    if (!dateString) return "—";
    const utc = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utc);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const getTransactionIcon = (type) => {
    const typeMap = {
      0: "topup", 1: "withdraw", 2: "escrowhold", 3: "escrowrelease",
      4: "escrowrefund", 5: "servicefee", 6: "adjustment"
    };
    const t = String(type).toLowerCase();
    const normalized = typeMap[type] || typeMap[t] || t;
    switch (normalized) {
      case "topup":
        return ArrowDownLeft;
      case "payment":
      case "withdraw":
        return ArrowUpRight;
      case "escrowhold":
      case "escrowrelease":
      case "escrowrefund":
        return Lock;
      default:
        return Clock;
    }
  };

  const loadWallet = async () => {
    try {
      setLoading(true);
      setError("");

      const [walletRes, summaryRes, txRes] = await Promise.all([
        walletApi.getWallet(),
        walletApi.getSummary(),
        walletApi.getTransactions({ PageNumber: 1, PageSize: 20 }),
      ]);

      setWallet(walletRes?.data?.data || null);
      setSummary(summaryRes?.data?.data || null);
      setTransactions(txRes?.data?.data?.items || txRes?.data?.data || []);
    } catch (e) {
      console.log("Load wallet failed:", e);
      setError(
        e?.response?.data?.message ||
        `Load wallet failed (${e?.response?.status || "network"})`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
  }, []);
  // Normalize transaction type — backend may return int enum or string
  const normalizeType = (type) => {
    const typeMap = {
      0: "topup", 1: "withdraw", 2: "escrowhold", 3: "escrowrelease",
      4: "escrowrefund", 5: "servicefee", 6: "adjustment",
      "topup": "topup", "withdraw": "withdraw",
      "escrowhold": "escrowhold", "escrow_hold": "escrowhold",
      "escrowrelease": "escrowrelease", "escrow_release": "escrowrelease",
      "escrowrefund": "escrowrefund", "escrow_refund": "escrowrefund",
      "servicefee": "servicefee", "service_fee": "servicefee",
      "adjustment": "adjustment", "payment": "payment",
    };
    const key = String(type).toLowerCase().replace(/\s/g, "");
    return typeMap[key] || typeMap[type] || key;
  };

  const isDebitType = (type) => {
    const t = normalizeType(type);
    return ["withdraw", "payment", "escrowhold", "servicefee"].includes(t);
  };

  const filteredTransactions =
    activeFilter === "all"
      ? transactions
      : transactions.filter((t) => {
        const nt = normalizeType(t.type);
        if (activeFilter === "topup") return nt === "topup";
        if (activeFilter === "withdraw") return nt === "withdraw";
        if (activeFilter === "payment") return nt === "payment";
        if (activeFilter === "escrow") return nt.startsWith("escrow");
        return false;
      });

  const filters = [
    { id: "all", label: "All" },
    { id: "topup", label: "Deposits" },
    { id: "payment", label: "Payments" },
    { id: "withdraw", label: "Withdrawals" },
    { id: "escrow", label: "Escrow" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-500 dark:text-neutral-400 dark:bg-neutral-950">
        Loading wallet...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 dark:text-red-400 dark:bg-neutral-950">
        {error}
      </div>
    );
  }

  const availableBalance =
    wallet?.availableBalance ?? wallet?.balance ?? 0;
  const escrowBalance = wallet?.lockedBalance ?? 0;
  const pendingWithdraw = summary?.totalWithdraw ?? 0;
  const totalEarnings = summary?.totalTopup ?? 0;
  const thisMonthSpent = summary?.totalSpent ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      {/* Header */}
      <div className="relative mx-4 mt-4 mb-6 rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/20 group">
        <div className="absolute inset-0 h-full bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 dark:from-blue-900 dark:via-blue-950 dark:to-neutral-950 transition-all duration-500 group-hover:scale-105">
          {/* Circuit Pattern */}
          <div className="absolute inset-0 opacity-[0.1]" style={{
            backgroundImage: `radial-gradient(#fff 1px, transparent 1px), radial-gradient(#fff 1px, transparent 1px)`,
            backgroundSize: `20px 20px`,
            backgroundPosition: `0 0, 10px 10px`
          }}></div>

          {/* Wave Pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            background: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)`
          }}></div>

          {/* Abstract glows */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-blue-400/30 rounded-full blur-[100px] mix-blend-overlay"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-80 h-80 bg-purple-500/30 rounded-full blur-[80px] mix-blend-overlay"></div>
        </div>

        {/* Card Elements Layer */}
        <div className="absolute top-6 left-8 opacity-20">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        <div className="relative z-10 px-4 md:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <h1 className="text-2xl md:text-3xl font-bold">
                My Wallet
              </h1>
            </div>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white"
            >
              {showBalance ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>

          {/* Main Balance */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/10 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div>
                <p className="text-blue-200 text-sm font-medium mb-1">
                  Available Balance
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  {showBalance
                    ? formatCurrency(availableBalance)
                    : "••••••••"}
                  <span className="text-lg text-blue-200 ml-2">
                    VND
                  </span>
                </h2>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDepositOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-blue-700 font-semibold rounded-xl"
                >
                  <ArrowDownLeft size={18} />
                  Deposit
                </button>
                <button
                  onClick={() => setIsWithdrawOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20"
                >
                  <ArrowUpRight size={18} />
                  Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 pb-6">
            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Escrow
              </p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {showBalance
                  ? formatCurrency(escrowBalance)
                  : "••••••"}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Pending Withdraw
              </p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {showBalance
                  ? formatCurrency(pendingWithdraw)
                  : "••••••"}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                Total Deposited
              </p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {showBalance
                  ? formatCurrency(totalEarnings)
                  : "••••••"}
              </p>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                This Month Spent
              </p>
              <p className="text-lg font-bold text-neutral-900 dark:text-white">
                {showBalance
                  ? formatCurrency(thisMonthSpent)
                  : "••••••"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="px-4 md:px-6 lg:px-8 pb-8 max-w-6xl mx-auto -mt-2">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Transaction History
              </h3>

              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === filter.id
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
                No transactions found
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const Icon = getTransactionIcon(tx.type);
                const amount = tx.amount ?? 0;
                const isDebit = isDebitType(tx.type);

                // Normalize status: backend returns int (0=Pending,1=Success,2=Failed) or string
                const rawStatus = tx.status ?? tx.statusDisplay ?? "";
                const statusStr = String(rawStatus).toLowerCase();
                const isSuccess = statusStr === "1" || statusStr === "success";
                const isPending = statusStr === "0" || statusStr === "pending";
                const isFailed = statusStr === "2" || statusStr === "failed";

                // Color logic: green only for successful credit, red for debit, gray for pending/failed
                let amountColor = "text-green-600 dark:text-green-400";
                let iconBg = "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400";
                let prefix = "+";

                if (isDebit && isSuccess) {
                  amountColor = "text-red-600 dark:text-red-400";
                  iconBg = "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400";
                  prefix = "-";
                } else if (isPending) {
                  amountColor = "text-amber-500 dark:text-amber-400";
                  iconBg = "bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400";
                  prefix = isDebit ? "-" : "+";
                } else if (isFailed) {
                  amountColor = "text-neutral-400 dark:text-neutral-500 line-through";
                  iconBg = "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500";
                  prefix = isDebit ? "-" : "+";
                }

                return (
                  <button
                    key={tx.id}
                    onClick={() => setSelectedTransaction(tx)}
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-900 dark:text-white">
                          {tx.description || tx.title || tx.type}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {formatTime(tx.createdAt || tx.time)}
                          </span>
                          {isPending && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded">
                              Pending
                            </span>
                          )}
                          {isFailed && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded">
                              Failed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${amountColor}`}>
                        {prefix}
                        {formatCurrency(Math.abs(amount))}
                      </p>
                      <ChevronRight size={16} className="text-neutral-400 dark:text-neutral-500" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onSuccess={loadWallet}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        currentBalance={availableBalance}
        onSuccess={loadWallet}
      />

      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
      />
    </div>
  );
};

export default WalletPage;
