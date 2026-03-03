export const getStatusLabel = (s) => {
    if (s === 0 || s === "Pending") return "Pending";
    if (s === 1 || s === "Approved") return "Approved";
    if (s === 2 || s === "Rejected") return "Rejected";
    return s;
};

export const getStatusColor = (s) => {
    let key = "Pending";
    if (s === 1 || s === "Approved") key = "Approved";
    if (s === 2 || s === "Rejected") key = "Rejected";

    const colors = {
        Pending: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
        Approved: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
        Rejected: "text-red-600 bg-red-50 dark:bg-red-900/20",
    };
    return colors[key] || colors.Pending;
};

export const formatDate = (dateString) => {
    if (!dateString) return "—";
    const utc = dateString.endsWith?.('Z') ? dateString : dateString + 'Z';
    return new Date(utc).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    const utc = dateString.endsWith?.('Z') ? dateString : dateString + 'Z';
    return new Date(utc).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
};

export const getActionLabel = (action) => {
    const labels = {
        0: "Submitted",
        1: "Approved",
        2: "Rejected",
        3: "Auto Approved",
        4: "Auto Rejected",
        5: "AI Re-evaluated"
    };
    return labels[action] ?? action;
};

export const getActionColor = (action) => {
    const colors = {
        0: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
        1: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
        2: "text-red-600 bg-red-50 dark:bg-red-900/20",
        3: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
        4: "text-red-600 bg-red-50 dark:bg-red-900/20",
        5: "text-purple-600 bg-purple-50 dark:bg-purple-900/20"
    };
    return colors[action] ?? colors[0];
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7082";

export const toAbsoluteUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${API_BASE}${url.startsWith("/") ? url : "/" + url}`;
};
