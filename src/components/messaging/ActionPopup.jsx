import React from 'react';
import { Image, Play, DollarSign, Calendar } from 'lucide-react';

/**
 * ActionPopup - Action Menu (Unified Blue Theme)
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - onAction: function(actionType)
 * - hideWorkActions: boolean (optional, hides work-related actions for group chat)
 */
const ActionPopup = ({ isOpen, onClose, onAction, hideWorkActions = false }) => {
  if (!isOpen) return null;

  const allActions = [
    {
      id: 'image',
      label: 'Send Image/File',
      desc: 'Upload images or files',
      icon: Image,
      isWorkAction: false,
    }
  ];

  const actions = hideWorkActions 
    ? allActions.filter(a => !a.isWorkAction)
    : allActions;

  return (
    <>
      {/* Invisible overlay */}
      <div
        className="fixed inset-0 z-10"
        onClick={onClose}
      />

      {/* Popup Container */}
      <div className="absolute bottom-16 left-2 w-64 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-20 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 origin-bottom-left">
        <div className="py-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  onAction(action.id);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center gap-3 group transition-colors"
              >
                {/* Icon */}
                <div className="flex-shrink-0 p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                  <Icon size={18} strokeWidth={2.5} />
                </div>

                {/* Text Info */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {action.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ActionPopup;
