import { useState, useEffect, useMemo, useCallback } from "react";
import adminApi from "../api/adminApi";

export default function useMentorApplications() {
    const [loading, setLoading] = useState(true);
    const [applications, setApplications] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize] = useState(10);
    const [status, setStatus] = useState("all");
    const [searchKeyword, setSearchKeyword] = useState("");
    const [debouncedKeyword, setDebouncedKeyword] = useState("");
    const [apiError, setApiError] = useState("");

    const [selectedApp, setSelectedApp] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const [reEvaluating, setReEvaluating] = useState(false);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        setApiError("");
        try {
            const queryStatus = status === "all" ? undefined : status;
            const res = await adminApi.getMentorApplications({ pageNumber, pageSize, status: queryStatus });
            const data = res?.data?.data ?? res?.data;
            setApplications(data?.items ?? []);
            setTotalCount(data?.totalCount ?? 0);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to load applications");
        } finally {
            setLoading(false);
        }
    }, [pageNumber, pageSize, status]);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedKeyword(searchKeyword), 400);
        return () => clearTimeout(handler);
    }, [searchKeyword]);

    useEffect(() => {
        fetchApplications();
    }, [fetchApplications]);

    const openDetail = async (app) => {
        setSelectedApp(app);
        setDetailOpen(true);
        try {
            const res = await adminApi.getMentorApplicationDetail(app.userId);
            const detail = res?.data?.data ?? res?.data;
            if (detail) setSelectedApp(detail);
        } catch (err) {
            console.error("Failed to load application detail:", err);
        }
    };

    const handleApprove = async (userId) => {
        const ok = window.confirm("Approve this mentor application?");
        if (!ok) return;

        setProcessing(true);
        setApiError("");
        try {
            await adminApi.approveMentorApplication(userId);
            await fetchApplications();
            setDetailOpen(false);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to approve application");
        } finally {
            setProcessing(false);
        }
    };

    const openReject = (app) => {
        setSelectedApp(app);
        setRejectReason("");
        setRejectOpen(true);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            setApiError("Rejection reason is required");
            return;
        }

        setProcessing(true);
        setApiError("");
        try {
            await adminApi.rejectMentorApplication(selectedApp.userId, rejectReason);
            await fetchApplications();
            setRejectOpen(false);
            setDetailOpen(false);
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to reject application");
        } finally {
            setProcessing(false);
        }
    };

    const handleReEvaluate = async (userId) => {
        const ok = window.confirm("Run AI analysis on this application? This will use Gemini API quota.");
        if (!ok) return;

        setReEvaluating(true);
        setApiError("");
        try {
            const res = await adminApi.reEvaluateMentorApplication(userId);
            const updatedApp = res?.data?.data;
            if (updatedApp) {
                setSelectedApp(updatedApp);
            }
            await fetchApplications();
            alert(res?.data?.message || "AI re-evaluation completed!");
        } catch (err) {
            setApiError(err?.response?.data?.message || "Failed to re-evaluate application");
        } finally {
            setReEvaluating(false);
        }
    };

    const filteredApplications = useMemo(() => {
        if (!debouncedKeyword) return applications;
        const keyword = debouncedKeyword.toLowerCase();
        return applications.filter((app) => {
            const fullName = String(app.fullName || "").toLowerCase();
            const email = String(app.email || "").toLowerCase();
            return fullName.includes(keyword) || email.includes(keyword);
        });
    }, [applications, debouncedKeyword]);

    return {
        loading, applications, totalCount, pageNumber, setPageNumber, pageSize,
        status, setStatus, searchKeyword, setSearchKeyword, debouncedKeyword,
        apiError, setApiError,
        selectedApp, setSelectedApp, detailOpen, setDetailOpen,
        rejectOpen, setRejectOpen, rejectReason, setRejectReason,
        processing, reEvaluating,
        fetchApplications, openDetail, handleApprove, openReject, handleReject, handleReEvaluate,
        filteredApplications
    };
}
