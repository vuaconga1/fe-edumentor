// src/api/walletApi.js
import axiosClient from "./axios";

const walletApi = {
  // GET /api/Wallet
  getWallet() {
    return axiosClient.get("/api/Wallet");
  },

  // GET /api/Wallet/summary
  getSummary() {
    return axiosClient.get("/api/Wallet/summary");
  },

  // GET /api/Wallet/transactions?PageNumber=&PageSize=&Type=&Status=&FromDate=&ToDate=
  getTransactions(params = {}) {
    return axiosClient.get("/api/Wallet/transactions", { params });
  },

  // POST /api/Wallet/topup  (Swagger: Wallet tag)
  topup(payload) {
    return axiosClient.post("/api/Wallet/topup", payload);
  },

  // POST /api/Wallet/withdraw
  withdraw(payload) {
    return axiosClient.post("/api/Wallet/withdraw", payload);
  },

  // GET /api/Wallet/topup/check/:transactionRef
  checkTransactionStatus(transactionRef) {
    return axiosClient.get(`/api/Wallet/topup/check/${transactionRef}`);
  },

  // GET /api/Wallet/vnpay/return?...params - Verify VNPay payment on backend
  verifyVnpayPayment(queryString) {
    return axiosClient.get(`/api/Wallet/vnpay/return${queryString}`);
  },

  // ============ ADMIN: Bank Transfer Management ============

  // GET /api/Wallet/bank-transfer/pending
  getPendingBankTransfers(params = {}) {
    return axiosClient.get("/api/Wallet/bank-transfer/pending", { params });
  },

  // POST /api/Wallet/bank-transfer/confirm/:transactionRef
  confirmBankTransfer(transactionRef) {
    return axiosClient.post(`/api/Wallet/bank-transfer/confirm/${transactionRef}`);
  },

  // POST /api/Wallet/bank-transfer/reject/:transactionRef
  rejectBankTransfer(transactionRef) {
    return axiosClient.post(`/api/Wallet/bank-transfer/reject/${transactionRef}`);
  },
};

export default walletApi;
