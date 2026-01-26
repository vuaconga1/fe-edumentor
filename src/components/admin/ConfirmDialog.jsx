import React from 'react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">{title}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
        </div>
        
        <div className="flex border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 text-sm font-medium border-l border-neutral-200 dark:border-neutral-800 transition-colors ${
              danger 
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' 
                : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
