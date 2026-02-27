import React from "react";

export default function MentorApplicationBanner({
    statusData,
    onOpenApply,
    onOpenConfirm
}) {
    if (!statusData) return null;

    // 1. Not Applied
    if (!statusData.hasApplied) {
        return (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                        Become a Mentor
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                        Share your expertise and help others grow. Apply now to join our mentor community.
                    </p>
                </div>
                <button
                    onClick={onOpenApply}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                    Apply Now
                </button>
            </div>
        );
    }

    // 2. Pending (Enum 0)
    if (statusData.status === "Pending" || statusData.status === 0) {
        return (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 mb-6">
                <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                        Application Under Review
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                        Your mentor application was submitted on {new Date(statusData.appliedAt?.endsWith?.('Z') ? statusData.appliedAt : statusData.appliedAt + 'Z').toLocaleDateString()}. We will notify you once it's reviewed.
                    </p>
                </div>
            </div>
        );
    }

    // 3. Approved (Enum 1)
    if (statusData.status === "Approved" || statusData.status === 1) {
        return (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                        Application Approved
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                        You have been approved to become a mentor. Confirm now to switch your profile.
                    </p>
                </div>
                <button
                    onClick={onOpenConfirm}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                    Confirm & Switch
                </button>
            </div>
        );
    }

    // 4. Rejected (Enum 2)
    if (statusData.status === "Rejected" || statusData.status === 2) {
        return (
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                        Application Rejected
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                        Reason: {statusData.rejectionReason}
                    </p>
                    <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-1">
                        You can update your application and apply again.
                    </p>
                </div>
                <button
                    onClick={onOpenApply}
                    className="px-5 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                    Update & Re-apply
                </button>
            </div>
        );
    }

    return null;
}
