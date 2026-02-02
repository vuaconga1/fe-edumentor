// DepositModal.jsx
import React, { useState } from "react";
import { X, CreditCard, Building2, Smartphone, CheckCircle, ArrowDownLeft, Shield, Copy, Check } from "lucide-react";
import walletApi from "../../api/walletApi";

const DepositModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bank");
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
    setError("");
  };

  const handleQuickSelect = (val) => {
    setAmount(val.toString());
    setError("");
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("1234567890");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = async () => {
    setError("");

    if (step === 1) {
      if (!amount || parseInt(amount) < 10000) {
        setError("Minimum deposit is 10,000 VND");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      try {
        setIsProcessing(true);

        await walletApi.topup({
          amount: parseInt(amount, 10),
          paymentMethod: selectedMethod,
        });

        setStep(3);
        onSuccess?.();
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
    setCopied(false);
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

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${s === step ? "w-8 bg-white" : s < step ? "w-4 bg-white/60" : "w-4 bg-white/30"
                  }`}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Enter Amount */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Enter Amount
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount ? formatCurrency(parseInt(amount)) : ""}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full px-4 py-4 text-2xl font-bold text-center bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                    VND
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-2 text-center">
                  Minimum: 10,000 VND
                </p>
              </div>

              {/* Quick Amounts */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Quick Select
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      onClick={() => handleQuickSelect(val)}
                      className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${amount === val.toString()
                          ? "bg-blue-600 text-white"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        }`}
                    >
                      {formatCurrency(val)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedMethod === method.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                          }`}
                      >
                        <div className={`p-2 rounded-lg ${selectedMethod === method.id
                            ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                          }`}>
                          <Icon size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-neutral-900 dark:text-white">{method.name}</p>
                          <p className="text-xs text-neutral-500">{method.desc}</p>
                        </div>
                        {selectedMethod === method.id && (
                          <CheckCircle size={20} className="ml-auto text-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="text-center py-4">
                <p className="text-sm text-neutral-500 mb-1">You're depositing</p>
                <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(parseInt(amount))} <span className="text-lg text-neutral-400">VND</span>
                </p>
              </div>

              {/* Bank Transfer Info */}
              {selectedMethod === "bank" && (
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 space-y-3">
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Transfer to this account:
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Bank</span>
                      <span className="text-sm font-medium">Vietcombank</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-500">Account No.</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium font-mono">1234567890</span>
                        <button onClick={handleCopyAccount} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded">
                          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-neutral-400" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Account Name</span>
                      <span className="text-sm font-medium">MENTOREDU</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-500">Content</span>
                      <span className="text-sm font-medium font-mono">DEPOSIT {Date.now()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Amount</span>
                  <span className="text-sm font-medium">{formatCurrency(parseInt(amount))} VND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Fee</span>
                  <span className="text-sm font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-sm font-bold text-blue-600">{formatCurrency(parseInt(amount))} VND</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                Deposit Successful!
              </h3>
              <p className="text-neutral-500 mb-4">
                {formatCurrency(parseInt(amount))} VND has been added to your wallet
              </p>
              <div className="inline-block px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl text-sm font-medium">
                Balance Updated
              </div>
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
                disabled={!amount || parseInt(amount) < 10000 || isProcessing}
                className={`flex-1 py-3.5 rounded-xl font-semibold text-white transition-all ${!amount || parseInt(amount) < 10000 || isProcessing
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
