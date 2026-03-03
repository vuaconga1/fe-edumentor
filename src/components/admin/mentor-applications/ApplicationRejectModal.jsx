import React from "react";

export default function ApplicationRejectModal({
    isOpen,
    app,
    rejectReason,
    setRejectReason,
    apiError,
    processing,
    onReject,
    onClose
}) {
    if (!isOpen || !app) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
                <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="font-bold text-neutral-900 dark:text-white">Reject Application</h3>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Please provide a reason for rejecting {app.fullName}'s application:
                    </p>
                    {apiError && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
                            {apiError}
                        </div>
                    )}
                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        placeholder="Enter rejection reason..."
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 text-neutral-700 dark:hover:bg-neutral-800 dark:text-neutral-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onReject}
                        disabled={processing}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                    >
                        {processing ? "Rejecting..." : "Reject"}
                    </button>
                </div>
            </div>
        </div>
    );
}
