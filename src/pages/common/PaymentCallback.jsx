// PaymentCallback.jsx - Handles MoMo & VNPay redirect after payment
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, Wallet } from "lucide-react";
import walletApi from "../../api/walletApi";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    // Detect payment method from query params
    const method = searchParams.get("method") || 
      (searchParams.get("vnp_ResponseCode") ? "vnpay" : "momo");

    if (method === "vnpay") {
      // VNPay redirects here directly with query params
      const vnpResponseCode = searchParams.get("vnp_ResponseCode");
      const txnRef = searchParams.get("vnp_TxnRef");
      const vnpAmount = searchParams.get("vnp_Amount");
      const vnpTransNo = searchParams.get("vnp_TransactionNo");

      const info = {
        orderId: txnRef,
        amount: vnpAmount ? parseInt(vnpAmount) / 100 : 0, // VNPay amount is x100
        transId: vnpTransNo,
        method: "VNPay",
      };
      setPaymentInfo(info);

      if (vnpResponseCode === "00") {
        // Forward all VNPay params to backend for verification & wallet credit
        const queryString = window.location.search;
        walletApi.verifyVnpayPayment(queryString)
          .then((res) => {
            if (res?.data?.success) {
              setStatus("success");
            } else {
              setStatus("success"); // VNPay said 00, trust it even if backend verify had issues
            }
          })
          .catch(() => {
            setStatus("success"); // VNPay already confirmed, IPN will handle it
          });
      } else if (vnpResponseCode === "24") {
        setStatus("cancelled");
      } else {
        setStatus("failed");
      }
    } else {
      // MoMo return params
      const resultCode = searchParams.get("resultCode");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");
      const transId = searchParams.get("transId");

      const info = {
        orderId,
        amount: amount ? parseInt(amount) : 0,
        transId,
        method: "MoMo",
      };
      setPaymentInfo(info);

      if (resultCode === "0") {
        setStatus("success");
        if (orderId) {
          walletApi.checkTransactionStatus(orderId).catch(() => {});
        }
      } else if (resultCode === "1006" || resultCode === "1005") {
        setStatus("cancelled");
      } else {
        setStatus("failed");
      }
    }
  }, [searchParams]);

  const formatCurrency = (val) =>
    val ? new Intl.NumberFormat("vi-VN").format(val) : "0";

  const getUserRole = () => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) return storedRole.toLowerCase();
    return "student";
  };

  const goToWallet = () => {
    const role = getUserRole();
    navigate(`/${role}/wallet`);
  };

  const statusConfig = {
    loading: {
      icon: Clock,
      title: "Processing...",
      subtitle: "Please wait a moment",
      bg: "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900",
      iconBg: "bg-white/20 animate-pulse",
    },
    success: {
      icon: CheckCircle,
      title: "Deposit Successful",
      subtitle: "Your wallet has been topped up",
      bg: "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900",
      iconBg: "bg-white/20",
    },
    failed: {
      icon: XCircle,
      title: "Payment Failed",
      subtitle: "Please try again",
      bg: "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900",
      iconBg: "bg-white/20",
    },
    cancelled: {
      icon: XCircle,
      title: "Payment Cancelled",
      subtitle: "You cancelled the transaction",
      bg: "bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900",
      iconBg: "bg-white/20",
    },
  };

  const config = statusConfig[status] || statusConfig.loading;
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-8 text-center ${config.bg}`}>
            <div className={`w-16 h-16 mx-auto mb-4 ${config.iconBg} rounded-full flex items-center justify-center`}>
              <Icon size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{config.title}</h2>
            <p className="text-blue-200 text-sm mt-1">{config.subtitle}</p>
          </div>

          {/* Payment Details */}
          {paymentInfo && (
            <div className="p-6 space-y-4">
              {paymentInfo.amount > 0 && (
                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-4 text-center">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {formatCurrency(paymentInfo.amount)}{" "}
                    <span className="text-sm text-neutral-400">VND</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {paymentInfo.orderId && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-neutral-500 dark:text-neutral-400">Order ID</span>
                    <span className="font-mono text-xs text-neutral-900 dark:text-white truncate max-w-[200px]">
                      {paymentInfo.orderId}
                    </span>
                  </div>
                )}
                {paymentInfo.transId && (
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-neutral-500 dark:text-neutral-400">Transaction ID</span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {paymentInfo.transId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm py-1">
                  <span className="text-neutral-500 dark:text-neutral-400">Method</span>
                  <span className="font-medium text-neutral-900 dark:text-white">
                    {paymentInfo.method || "MoMo"}
                  </span>
                </div>
                <div className="flex justify-between text-sm py-1">
                  <span className="text-neutral-500 dark:text-neutral-400">Status</span>
                  <span className={`font-medium ${status === "success" ? "text-green-600" :
                      status === "failed" || status === "cancelled" ? "text-red-500" :
                        "text-blue-600"
                    }`}>
                    {status === "success" ? "Completed" :
                      status === "cancelled" ? "Cancelled" :
                        status === "failed" ? "Failed" : "Processing"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 pb-6">
            <button
              onClick={goToWallet}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Wallet size={18} />
              Go to Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCallback;
