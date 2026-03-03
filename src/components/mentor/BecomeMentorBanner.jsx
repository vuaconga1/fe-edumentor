import { useState } from "react";
import { HiX } from "react-icons/hi";

export default function BecomeMentorBanner({ onTryIt }) {
    const [isVisible, setIsVisible] = useState(
        () => !localStorage.getItem("mentorBannerDismissed")
    );
    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem("mentorBannerDismissed", "true");
    };

    if (!isVisible) return null;

    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-semibold border border-indigo-100 dark:border-indigo-800">
                        New Feature
                    </span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    Become a Mentor Today
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm max-w-xl">
                    Share your expertise, inspire others, and earn money by mentoring students. Join our growing community.
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onTryIt}
                    className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                    Try it now
                </button>
                <button
                    onClick={handleDismiss}
                    className="p-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                    title="Dismiss"
                >
                    <HiX className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
