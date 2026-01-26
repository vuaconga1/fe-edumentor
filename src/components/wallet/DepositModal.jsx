// DepositModal.jsx
import React, { useState } from "react";
import { X, CreditCard, Building2, Smartphone, CheckCircle, ArrowDownLeft, Shield } from "lucide-react";
import walletApi from "../../api/WalletApi";
const DepositModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bank");
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  const quickAmounts = [100000, 200000, 500000, 1000000, 2000000, 5000000];

  const paymentMethods = [
    { id: "bank", name: "Bank Transfer", icon: Building2, desc: "Direct from your bank account" },
    { id: "card", name: "Credit/Debit Card", icon: CreditCard, desc: "Visa, Mastercard, JCB" },
    { id: "ewallet", name: "E-Wallet", icon: Smartphone, desc: "MoMo, ZaloPay, VNPay" },
  ];

  const formatCurrency = (val) => new Intl.NumberFormat("vi-VN").format(val);

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setAmount(value);
  };

  const handleQuickSelect = (val) => setAmount(val.toString());

  const handleContinue = async () => {
    setError("");

    if (step === 1) {
      if (!amount || parseInt(amount) < 10000) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      try {
        setIsProcessing(true);

        // Backend thường chỉ cần amount. Mình gửi thêm method cũng ok (extra field thường bị ignore).
        await walletApi.topup({
          amount: parseInt(amount, 10),
          method: selectedMethod,
        });

        setStep(3);
        onSuccess?.(); // ✅ refresh wallet page
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Deposit failed";
        setError(msg);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleClose = () => {
    setStep(1);
    setAmount("");
    setSelectedMethod("bank");
    setIsProcessing(false);
    setError("");
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <ArrowDownLeft size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Deposit Funds</h2>
              <p className="text-blue-100 text-sm">Add money to your wallet</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* ... GIỮ NGUYÊN UI CỦA MÀY PHẦN STEP 1/2/3 ... */}
          {/* Chỉ cần đảm bảo các handler dưới footer gọi handleContinue/handleClose */}
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
                disabled={!amount || parseInt(amount) < 10000 || isProcessing}
                className={`flex-1 py-3.5 rounded-xl font-semibold text-white transition-all ${
                  !amount || parseInt(amount) < 10000 || isProcessing
                    ? "bg-neutral-300 dark:bg-neutral-700 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                }`}
              >
                {isProcessing ? "Processing..." : step === 1 ? "Continue" : "Confirm Deposit"}
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              className="w-full py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
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

export default DepositModal;
