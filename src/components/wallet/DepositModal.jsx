// DepositModal.jsx
import React, { useState } from "react";
import { X, CheckCircle, ArrowDownLeft, Shield, Smartphone, CreditCard, Building2, Copy, Check } from "lucide-react";
import walletApi from "../../api/walletApi";

const DepositModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [bankTransferData, setBankTransferData] = useState(null);
  const [copied, setCopied] = useState("");

  const quickAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

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

        const res = await walletApi.topup({
          amount: parseInt(amount, 10),
          paymentMethod: paymentMethod,
        });

        const data = res?.data?.data;

        if (paymentMethod === "bank_transfer") {
          // Show QR code step instead of redirect
          if (data?.qrCodeUrl) {
            setBankTransferData(data);
            setStep(3);
          } else {
            setError("Could not generate QR code. Please try again.");
          }
        } else {
          // MoMo / VNPay → redirect
          const paymentUrl = data?.paymentUrl;
          if (paymentUrl) {
            window.location.href = paymentUrl;
          } else {
            setError("Could not create payment. Please try again.");
          }
        }
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Deposit failed";
        setError(msg);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const handleClose = () => {
    setStep(1);
    setAmount("");
    setPaymentMethod("momo");
    setIsProcessing(false);
    setError("");
    setBankTransferData(null);
    setCopied("");
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-6 py-5">
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
            {(paymentMethod === "bank_transfer" ? [1, 2, 3] : [1, 2]).map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${s === step ? "w-8 bg-white" : s < step ? "w-4 bg-white/60" : "w-4 bg-white/30"}`}
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
          {/* Step 1 */}
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

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {/* MoMo */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("momo")}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "momo"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      paymentMethod === "momo"
                        ? "bg-pink-100 dark:bg-pink-900/50 text-pink-600"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                    }`}>
                      <Smartphone size={20} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-neutral-900 dark:text-white">MoMo Wallet</p>
                      <p className="text-xs text-neutral-500">QR Code, Bank Cards, E-Wallet</p>
                    </div>
                    {paymentMethod === "momo" && (
                      <CheckCircle size={20} className="text-blue-600 shrink-0" />
                    )}
                  </button>

                  {/* VNPay */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("vnpay")}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "vnpay"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      paymentMethod === "vnpay"
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                    }`}>
                      <CreditCard size={20} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-neutral-900 dark:text-white">VNPay</p>
                      <p className="text-xs text-neutral-500">ATM Cards, Credit/Debit Cards, QR Pay</p>
                    </div>
                    {paymentMethod === "vnpay" && (
                      <CheckCircle size={20} className="text-blue-600 shrink-0" />
                    )}
                  </button>

                  {/* Bank Transfer (VietQR) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank_transfer")}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === "bank_transfer"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      paymentMethod === "bank_transfer"
                        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-500"
                    }`}>
                      <Building2 size={20} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-neutral-900 dark:text-white">Bank Transfer</p>
                      <p className="text-xs text-neutral-500">VietQR - Scan & Transfer via Banking App</p>
                    </div>
                    {paymentMethod === "bank_transfer" && (
                      <CheckCircle size={20} className="text-blue-600 shrink-0" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Bank Transfer QR */}
          {step === 3 && bankTransferData && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-neutral-500 mb-1">Scan QR to transfer</p>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {formatCurrency(parseInt(amount))} <span className="text-base text-neutral-400">VND</span>
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-2xl shadow-lg">
                  <img
                    src={bankTransferData.qrCodeUrl}
                    alt="VietQR Code"
                    className="w-56 h-56 object-contain"
                  />
                </div>
              </div>

              {/* Bank Info */}
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500">Bank</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{bankTransferData.bankId}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500">Account Number</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{bankTransferData.accountNo}</p>
                  </div>
                  <button onClick={() => handleCopy(bankTransferData.accountNo, 'accountNo')} className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    {copied === 'accountNo' ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-neutral-400" />}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500">Account Name</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">{bankTransferData.accountName}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-neutral-500">Transfer Description</p>
                    <p className="text-sm font-semibold text-blue-600 break-all">{bankTransferData.transferDescription}</p>
                  </div>
                  <button onClick={() => handleCopy(bankTransferData.transferDescription, 'desc')} className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shrink-0 ml-2">
                    {copied === 'desc' ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-neutral-400" />}
                  </button>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  <strong>Important:</strong> Please include the transfer description exactly as shown above. Your wallet will be credited after admin confirmation.
                </p>
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

              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 space-y-2">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {paymentMethod === "bank_transfer" ? (
                    <>A <span className="font-semibold text-neutral-900 dark:text-white">VietQR</span> code will be generated for you to scan with your banking app.</>  
                  ) : (
                    <>You will be redirected to{" "}
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {paymentMethod === "vnpay" ? "VNPay" : "MoMo"}
                    </span>{" "}
                    to complete your payment. After payment, you'll return to this site automatically.</>
                  )}
                </p>
              </div>

              {/* Summary */}
              <div className="space-y-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Amount</span>
                  <span className="text-sm font-medium">{formatCurrency(parseInt(amount))} VND</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-neutral-500">Method</span>
                  <span className="text-sm font-medium">
                    {paymentMethod === "bank_transfer" ? "Bank Transfer (VietQR)" : paymentMethod === "vnpay" ? "VNPay" : "MoMo Wallet"}
                  </span>
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
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          {step === 3 ? (
            <>
              <button
                onClick={() => { setStep(2); setBankTransferData(null); }}
                className="flex-1 py-3.5 rounded-xl font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleClose}
                className="flex-1 py-3.5 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all"
              >
                I've Transferred
              </button>
            </>
          ) : (
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
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : step === 1 ? "Continue" : paymentMethod === "bank_transfer" ? "Generate QR" : `Pay with ${paymentMethod === "vnpay" ? "VNPay" : "MoMo"}`}
              </button>
            </>
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
