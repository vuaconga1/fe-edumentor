import React from "react";
import { HiX } from "react-icons/hi";
import { normalizeAvatarUrl, buildDefaultAvatarUrl } from "../../../utils/avatar";
import { getStatusColor, getStatusLabel, formatDate, toAbsoluteUrl } from "../../../utils/applicationUtils";

export default function ApplicationDetailModal({
    app,
    onClose,
    onReEvaluate,
    reEvaluating,
    processing,
    onOpenReject,
    onApprove
}) {
    if (!app) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">Application Details</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <HiX className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-4">
                        <img
                            src={normalizeAvatarUrl(app.avatarUrl) || buildDefaultAvatarUrl({ id: app.userId, fullName: app.fullName, email: app.email })}
                            alt=""
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = buildDefaultAvatarUrl({ id: app.userId, fullName: app.fullName, email: app.email });
                            }}
                        />
                        <div>
                            <h4 className="text-lg font-bold text-neutral-900 dark:text-white">{app.fullName}</h4>
                            <p className="text-neutral-500">{app.email}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <div>
                            <p className="text-xs text-neutral-500">Specialization</p>
                            <p className="font-medium text-neutral-900 dark:text-white">{app.specialization || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Experience</p>
                            <p className="font-medium text-neutral-900 dark:text-white">{app.experienceYears ? `${app.experienceYears} years` : "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Status</p>
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.approvalStatus)}`}>
                                {getStatusLabel(app.approvalStatus)}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500">Applied Date</p>
                            <p className="font-medium text-neutral-900 dark:text-white">{formatDate(app.createdAt)}</p>
                        </div>
                    </div>

                    {/* Categories */}
                    {app.categories && app.categories.length > 0 && (
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 mb-2">Categories</p>
                            <div className="flex flex-wrap gap-2">
                                {app.categories.map((cat, idx) => (
                                    <span key={idx} className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-md">
                                        {cat.name || cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hashtags */}
                    {app.hashtags && app.hashtags.length > 0 && (
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 mb-2">Hashtags / Skills</p>
                            <div className="flex flex-wrap gap-2">
                                {app.hashtags.map((tag, idx) => (
                                    <span key={idx} className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 rounded-md">
                                        #{tag.name || tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {app.introduction && (
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 mb-1">Introduction</p>
                            <p className="text-sm text-neutral-700 dark:text-neutral-300">{app.introduction}</p>
                        </div>
                    )}

                    {app.portfolioUrl && (
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 mb-1">Portfolio</p>
                            <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                {app.portfolioUrl}
                            </a>
                        </div>
                    )}

                    {app.certificationUrls && (
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 mb-2">Qualifications / CV</p>
                            <div className="flex flex-col gap-2">
                                {app.certificationUrls.split(',').map((url, idx) => (
                                    <a
                                        key={idx}
                                        href={toAbsoluteUrl(url.trim())}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        View Document {idx + 1}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {app.rejectionReason && (
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <p className="text-xs text-neutral-500 mb-1">Rejection Reason</p>
                            <p className="text-sm text-red-600">{app.rejectionReason}</p>
                        </div>
                    )}

                    {/* AI Analysis Section */}
                    {app.isAiReviewed && (
                        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center gap-2 mb-3">
                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">AI Analysis</h4>
                                {app.aiModelVersion && (
                                    <span className="text-xs text-neutral-400">({app.aiModelVersion})</span>
                                )}
                            </div>

                            {/* Confidence Score */}
                            {app.aiConfidenceScore != null && (
                                <div className="mb-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-neutral-500">Confidence Score</span>
                                        <span className={`text-sm font-semibold ${app.aiConfidenceScore >= 80 ? 'text-emerald-600' :
                                                app.aiConfidenceScore >= 50 ? 'text-amber-600' :
                                                    'text-red-600'
                                            }`}>
                                            {app.aiConfidenceScore}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${app.aiConfidenceScore >= 80 ? 'bg-emerald-500' :
                                                    app.aiConfidenceScore >= 50 ? 'bg-amber-500' :
                                                        'bg-red-500'
                                                }`}
                                            style={{ width: `${app.aiConfidenceScore}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Recommended Action */}
                            {app.aiRecommendedAction && (
                                <div className="mb-3">
                                    <span className="text-xs text-neutral-500 block mb-1">Recommendation</span>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${app.aiRecommendedAction === 'AUTO_APPROVE'
                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            app.aiRecommendedAction === 'AUTO_REJECT'
                                                ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                        {app.aiRecommendedAction === 'AUTO_APPROVE' ? 'Auto Approve' :
                                            app.aiRecommendedAction === 'AUTO_REJECT' ? 'Auto Reject' :
                                                'Manual Review'}
                                    </span>
                                </div>
                            )}

                            {/* AI Reasoning */}
                            {app.aiReasoning && (
                                <div className="mb-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
                                    <p className="text-xs text-neutral-500 mb-1">Reasoning</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{app.aiReasoning}</p>
                                </div>
                            )}

                            {/* Key Points */}
                            {app.aiKeyPoints && app.aiKeyPoints.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs text-neutral-500 mb-1.5">Strengths</p>
                                    <ul className="space-y-1">
                                        {app.aiKeyPoints.map((point, idx) => (
                                            <li key={idx} className="text-sm text-neutral-700 dark:text-neutral-300 pl-3 border-l-2 border-emerald-400">
                                                {point}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Red Flags */}
                            {app.aiRedFlags && app.aiRedFlags.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-xs text-neutral-500 mb-1.5">Concerns</p>
                                    <ul className="space-y-1">
                                        {app.aiRedFlags.map((flag, idx) => (
                                            <li key={idx} className="text-sm text-neutral-700 dark:text-neutral-300 pl-3 border-l-2 border-red-400">
                                                {flag}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action buttons section */}
                <div className="px-5 py-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap justify-end gap-3">
                    {/* Re-evaluate with AI — always available */}
                    <button
                        onClick={() => onReEvaluate(app.userId)}
                        disabled={reEvaluating || processing}
                        className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                    >
                        {reEvaluating ? (
                            <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                Analyzing...
                            </>
                        ) : (
                            "Re-evaluate with AI"
                        )}
                    </button>

                    {/* Approve/Reject — only for Pending */}
                    {(app.approvalStatus === "Pending" || app.approvalStatus === 0) && (
                        <>
                            <button
                                onClick={() => onOpenReject(app)}
                                className="px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => onApprove(app.userId)}
                                disabled={processing}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50"
                            >
                                {processing ? "Processing..." : "Approve"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
