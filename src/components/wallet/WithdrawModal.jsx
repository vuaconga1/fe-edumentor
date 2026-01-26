// WithdrawModal.jsx
import React, { useState } from "react";
import { X, CheckCircle, ArrowUpRight, Shield, AlertCircle } from "lucide-react";
import walletApi from "../../api/WalletApi";
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

  const banks = ["Vietcombank", "Techcombank", "MB Bank", "BIDV", "VietinBank", "ACB", "Sacombank", "TPBank", "VPBank", "Agribank"];
  const formatCurrency = (val) => new Intl.NumberFormat("vi-VN").format(val);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
  };

  const handleWithdrawAll = () => setAmount(String(currentBalance || 0));

  const handleContinue = async () => {
    setError("");

    if (step === 1) {
      if (!amount) return;
      const v = parseInt(amount, 10);
      if (Number.isNaN(v) || v < 50000 || v > currentBalance) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder) return;

      try {
        setIsProcessing(true);

        await walletApi.withdraw({
          amount: parseInt(amount, 10),
          bankName: bankInfo.bankName,
          bankAccountNumber: bankInfo.accountNumber,
          accountHolderName: bankInfo.accountHolder,
        });

        setStep(3);
        onSuccess?.(); // ✅ refresh wallet page
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
    onClose?.();
  };

  const isValidAmount = amount && parseInt(amount) >= 50000 && parseInt(amount) <= currentBalance;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-5">
          <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white">
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
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Content (giữ UI cũ của mày, chỉ đảm bảo onChange dùng setBankInfo đúng) */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* ... GIỮ NGUYÊN UI ... */}
          {/* Đảm bảo các onChange dùng:
              setBankInfo({ ...bankInfo, bankName: e.target.value })
              setBankInfo({ ...bankInfo, accountNumber: ... })
              setBankInfo({ ...bankInfo, accountHolder: ... })
          */}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {step < 3 ? (
            <>
              <button
                onClick={step === 1 ? handleClose : () => setStep(1)}
                className="flex-1 py-3.5 rounded-xl font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              >
                {step === 1 ? "Cancel" : "Back"}
              </button>

              <button
                onClick={handleContinue}
                disabled={(step === 1 && !isValidAmount) || (step === 2 && (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder)) || isProcessing}
                className={`flex-1 py-3.5 rounded-xl font-semibold text-white ${
                  (step === 1 && !isValidAmount) || (step === 2 && (!bankInfo.bankName || !bankInfo.accountNumber || !bankInfo.accountHolder)) || isProcessing
                    ? "bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
                }`}
              >
                {isProcessing ? "Processing..." : step === 1 ? "Continue" : "Confirm Withdraw"}
              </button>
            </>
          ) : (
            <button onClick={handleClose} className="w-full py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700">
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
