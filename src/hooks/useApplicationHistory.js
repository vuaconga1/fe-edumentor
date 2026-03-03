import { useState, useEffect, useMemo, useCallback } from "react";
import adminApi from "../api/adminApi";

export default function useApplicationHistory() {
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPageNumber, setHistoryPageNumber] = useState(1);
    const [historyTotalCount, setHistoryTotalCount] = useState(0);
    const [historyPageSize] = useState(10);
    const [historyActionFilter, setHistoryActionFilter] = useState("all");
    const [historySearchQuery, setHistorySearchQuery] = useState("");

    const fetchHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await adminApi.getApplicationHistory({
                pageNumber: historyPageNumber,
                pageSize: historyPageSize,
                action: historyActionFilter === "all" ? null : historyActionFilter
            });
            const data = res?.data?.data ?? res?.data;
            setHistoryData(data?.items ?? []);
            setHistoryTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setHistoryLoading(false);
        }
    }, [historyPageNumber, historyPageSize, historyActionFilter]);

    const openHistory = () => {
        setHistoryOpen(true);
        setHistoryPageNumber(1);
        setHistoryActionFilter("all");
        setHistorySearchQuery("");
    };

    const closeHistory = () => {
        setHistoryOpen(false);
    };

    useEffect(() => {
        if (historyOpen) {
            fetchHistory();
        }
    }, [historyOpen, historyPageNumber, historyActionFilter, fetchHistory]);

    const filteredAndSortedHistoryData = useMemo(() => {
        if (!historyData || historyData.length === 0) return [];
        let filtered = historyData;

        if (historySearchQuery.trim()) {
            const query = historySearchQuery.toLowerCase();
            const matchingUserIds = new Set();
            historyData.forEach(item => {
                const fullName = (item.userFullName || "").toLowerCase();
                const email = (item.userEmail || "").toLowerCase();
                if (fullName.includes(query) || email.includes(query)) {
                    matchingUserIds.add(item.userId);
                }
            });
            filtered = historyData.filter(item => matchingUserIds.has(item.userId));
        }

        const sorted = [...filtered].sort((a, b) => {
            if (a.userId !== b.userId) {
                const nameA = (a.userFullName || a.userEmail || "").toLowerCase();
                const nameB = (b.userFullName || b.userEmail || "").toLowerCase();
                return nameA.localeCompare(nameB);
            }
            return new Date(b.createdAt?.endsWith?.('Z') ? b.createdAt : b.createdAt + 'Z') - new Date(a.createdAt?.endsWith?.('Z') ? a.createdAt : a.createdAt + 'Z');
        });

        return sorted;
    }, [historyData, historySearchQuery]);

    return {
        historyOpen, openHistory, closeHistory,
        historyData, historyLoading, historyTotalCount,
        historyPageSize, historyPageNumber, setHistoryPageNumber,
        historyActionFilter, setHistoryActionFilter,
        historySearchQuery, setHistorySearchQuery,
        filteredAndSortedHistoryData, fetchHistory
    };
}
