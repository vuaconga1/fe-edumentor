import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

const actionLabels = {
  start: "Start",
  pause: "Pause",
  end: "End",
  complete: "Complete Order",
};

const normalizeActionType = (actionType) =>
  String(actionType || "").toLowerCase();

const WorkActionConfirmModal = ({ isOpen, actionType, onAccept, onReject }) => {
  if (!isOpen) return null;

  const normalizedType = normalizeActionType(actionType);
  const label = actionLabels[normalizedType] || "Confirm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {label} work session?
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            The other person is requesting to {label.toLowerCase()} the work session.
            Do you agree?
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 rounded-xl border border-neutral-200 bg-white py-2.5 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <XCircle size={18} />
              Decline
            </span>
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <CheckCircle2 size={18} />
              Accept
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkActionConfirmModal;