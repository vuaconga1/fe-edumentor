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
};

export default walletApi;
    