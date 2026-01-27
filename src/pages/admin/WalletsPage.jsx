// src/pages/admin/WalletsPage.jsx
import React, { useEffect, useState } from "react";
import { HiFilter, HiEye, HiRefresh } from "react-icons/hi";
import adminApi from "../../api/adminApi";

export default function WalletsPage() {
    const [loading, setLoading] = useState(true);
    const [wallets, setWallets] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [keyword, setKeyword] = useState("");
    const [filterBalance, setFilterBalance] = useState("all");
    const [apiError, setApiError] = useState("");

    const fetchWallets = async () => {
        setLoading(true);
        setApiError("");
        try {
            const res = await adminApi.getWallets({ pageNumber, pageSize, keyword });
            const data = res?.data?.data ?? res?.data;
            setWallets(data?.items ?? []);
            setTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to load wallets");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWallets(); }, [pageNumber]);

    const handleSearch = () => { setPageNumber(1); fetchWallets(); };

    const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN").format(amount || 0) + "đ";
    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Wallets</h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Manage user wallets {totalCount > 0 && `(${totalCount} total)`}
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <HiFilter className="w-5 h-5 text-neutral-400" />
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Search by user name..."
                    className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 flex-1"
                />
                <select
                    value={filterBalance}
                    onChange={(e) => { setFilterBalance(e.target.value); setPageNumber(1); }}
                    className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                    <option value="all">All Balances</option>
                    <option value="hasBalance">Has Balance</option>
                    <option value="noBalance">No Balance</option>
                    <option value="hasLocked">Has Locked</option>
                </select>
                {(keyword || filterBalance !== "all") && (
                    <button
                        onClick={() => { setKeyword(""); setFilterBalance("all"); }}
                        className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                    >
                        Clear filters
                    </button>
                )}
                <button onClick={fetchWallets} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Refresh">
                    <HiRefresh className="w-5 h-5 text-neutral-500" />
                </button>
            </div>

            {apiError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl p-4">{apiError}</div>}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/60">
                            <tr className="text-left text-sm font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Balance</th>
                                <th className="px-6 py-4">Locked</th>
                                <th className="px-6 py-4">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {loading ? <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500">Loading...</td></tr>
                                : wallets.length === 0 ? <tr><td colSpan={5} className="px-6 py-10 text-center text-neutral-500">No wallets</td></tr>
                                    : wallets.map((w) => (
                                        <tr key={w.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                            <td className="px-6 py-4 text-sm font-mono">#{w.id}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={w.userAvatarUrl || "/avatar-default.jpg"} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    <div>
                                                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{w.userName || "—"}</p>
                                                        <p className="text-xs text-neutral-500">{w.userEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-emerald-600">{formatCurrency(w.balance)}</td>
                                            <td className="px-6 py-4 text-sm text-amber-600">{formatCurrency(w.lockedBalance)}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-neutral-900 dark:text-white">{formatCurrency((w.balance || 0) + (w.lockedBalance || 0))}</td>
                                        </tr>
                                    ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                        <button disabled={pageNumber === 1} onClick={() => setPageNumber((p) => p - 1)} className="px-4 py-2 rounded-xl border disabled:opacity-50">Previous</button>
                        <span className="text-sm text-neutral-500">Page {pageNumber} of {totalPages}</span>
                        <button disabled={pageNumber === totalPages} onClick={() => setPageNumber((p) => p + 1)} className="px-4 py-2 rounded-xl border disabled:opacity-50">Next</button>
                    </div>
                )}
            </div>
        </div>
    );
}
