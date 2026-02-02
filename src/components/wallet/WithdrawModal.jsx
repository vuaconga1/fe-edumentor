// WithdrawModal.jsx
import React, { useState } from "react";
import { X, CheckCircle, ArrowUpRight, Shield, AlertCircle, ChevronDown } from "lucide-react";
import walletApi from "../../api/walletApi";

const WithdrawModal = ({ isOpen, onClose, onSuccess, currentBalance = 0 }) => {
  const [amount, setAmount] = useState("");
  const [bankInfo, setBankInfo] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  const banks = ["Vietcombank", "Techcombank", "MB Bank", "BIDV", "VietinBank", "ACB", "Sacombank", "TPBank", "VPBank", "Agribank"];
  const formatCurrency = (val) => new Intl.NumberFormat("vi-VN").format(val);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
    setError("");
  };

  const handleWithdrawAll = () => {
    setAmount(String(currentBalance || 0));
    setError("");
  };

  const handleContinue = async () => {
    setError("");

    if (step === 1) {
      if (!amount) return;
      const v = parseInt(amount, 10);
      if (Number.isNaN(v) || v < 50000) {
        setError("Minimum withdrawal is 50,000 VND");
        return;
      }
      if (v > currentBalance) {
        setError("Insufficient balance");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) {
        setError("Please fill in all bank details");
        return;
      }

      try {
        setIsProcessing(true);

        await walletApi.withdraw({
          amount: parseInt(amount, 10),
          bankName: bankInfo.bankName,
          bankAccountNumber: bankInfo.accountNumber,
          accountHolderName: bankInfo.accountHolder,
        });

        setStep(3);
        onSuccess?.();
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Withdraw failed";
        setError(msg);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleClose = () => {
    setStep(1);
    setAmount("");
    setBankInfo({ bankName: "", accountNumber: "", accountHolder: "" });
    setIsProcessing(false);
    setError("");
    setShowBankDropdown(false);
    onClose?.();
  };

  const isValidAmount = amount && parseInt(amount) >= 50000 && parseInt(amount) <= currentBalance;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-5">
          <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <ArrowUpRight size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Withdraw Funds</h2>
              <p className="text-emerald-100 text-sm">Transfer to your bank account</p>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white/10 rounded-xl">
            <p className="text-emerald-100 text-xs">Available Balance</p>
            <p className="text-white font-bold text-lg">{formatCurrency(currentBalance)} VND</p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  s === step ? "w-8 bg-white" : s < step ? "w-4 bg-white/60" : "w-4 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Enter Amount */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Withdrawal Amount
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount ? formatCurrency(parseInt(amount)) : ""}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full px-4 py-4 text-2xl font-bold text-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                    VND
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-neutral-500">
                    Min: 50,000 VND
                  </p>
                  <button
                    onClick={handleWithdrawAll}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Withdraw All
                  </button>
                </div>
              </div>

              {/* Quick Amounts */}
              <div className="grid grid-cols-3 gap-2">
                {[100000, 200000, 500000, 1000000, 2000000].filter(v => v <= currentBalance).map((val) => (
                  <button
                    key={val}
                    onClick={() => { setAmount(val.toString()); setError(""); }}
                    className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${
                      amount === val.toString()
                        ? "bg-emerald-600 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Bank Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center py-2 mb-4">
                <p className="text-sm text-neutral-500">Withdrawing</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(parseInt(amount))} <span className="text-base text-neutral-400">VND</span>
                </p>
              </div>

              {/* Bank Selection */}
              <div className="relative">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Bank Name
                </label>
                <button
                  type="button"
                  onClick={() => setShowBankDropdown(!showBankDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-left"
                >
                  <span className={bankInfo.bankName ? "text-neutral-900 dark:text-white" : "text-neutral-400"}>
                    {bankInfo.bankName || "Select bank"}
                  </span>
                  <ChevronDown size={18} className={`text-neutral-400 transition-transform ${showBankDropdown ? "rotate-180" : ""}`} />
                </button>
                
                {showBankDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {banks.map((bank) => (
                      <button
                        key={bank}
                        onClick={() => {
                          setBankInfo({ ...bankInfo, bankName: bank });
                          setShowBankDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${
                          bankInfo.bankName === bank ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" : "text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={bankInfo.accountNumber}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value.replace(/[^0-9]/g, "") })}
                  placeholder="Enter your account number"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none font-mono"
                />
              </div>

              {/* Account Holder */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={bankInfo.accountHolder}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountHolder: e.target.value.toUpperCase() })}
                  placeholder="As shown on your bank account"
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none uppercase"
                />
              </div>

              {/* Summary */}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Amount</span>
                  <span className="font-medium">{formatCurrency(parseInt(amount))} VND</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Fee</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span className="font-medium">You'll receive</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(parseInt(amount))} VND</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                Withdrawal Requested!
              </h3>
              <p className="text-neutral-500 mb-4">
                {formatCurrency(parseInt(amount))} VND will be transferred to your bank account
              </p>
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Bank</span>
                  <span className="font-medium">{bankInfo.bankName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Account</span>
                  <span className="font-medium font-mono">{bankInfo.accountNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-500">Status</span>
                  <span className="font-medium text-amber-600">Processing</span>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mt-4">
                Typically takes 1-3 business days
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {step < 3 ? (
            <>
              <button
                onClick={step === 1 ? handleClose : () => setStep(1)}
                className="flex-1 py-3.5 rounded-xl font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                {step === 1 ? "Cancel" : "Back"}
              </button>

              <button
                onClick={handleContinue}
                disabled={(step === 1 && !isValidAmount) || (step === 2 && (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder)) || isProcessing}
                className={`flex-1 py-3.5 rounded-xl font-semibold text-white transition-all ${
                  (step === 1 && !isValidAmount) || (step === 2 && (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder)) || isProcessing
                    ? "bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
                }`}
              >
                {isProcessing ? "Processing..." : step === 1 ? "Continue" : "Confirm Withdraw"}
              </button>
            </>
          ) : (
            <button onClick={handleClose} className="w-full py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
              Done
            </button>
          )}
        </div>

        <div className="px-6 pb-4">
          <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs">
            <Shield size={14} />
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawModal;
