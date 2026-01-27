// src/components/admin/ActionButton.jsx
import React from "react";

/**
 * Unified action button component for admin pages
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component
 * @param {string} props.tooltip - Tooltip text
 * @param {function} props.onClick - Click handler
 * @param {string} props.variant - Button variant: 'default', 'success', 'warning', 'danger', 'info'
 * @param {boolean} props.disabled - Disabled state
 */
export default function ActionButton({ 
    icon, 
    tooltip, 
    onClick, 
    variant = 'default',
    disabled = false 
}) {
    const variants = {
        default: 'text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
        success: 'text-neutral-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
        warning: 'text-neutral-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20',
        danger: 'text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
        info: 'text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    };

    return (
        <div className="relative group inline-flex">
            <button
                onClick={onClick}
                disabled={disabled}
                className={`p-1.5 rounded-lg transition-colors ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {React.isValidElement(icon)
                    ? icon
                    : typeof icon === 'function'
                    ? React.createElement(icon, { className: 'w-4 h-4' })
                    : null}
            </button>
            {tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-neutral-800 dark:bg-neutral-700 rounded-md whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                    {tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800 dark:border-t-neutral-700"></div>
                </div>
            )}
        </div>
    );
}
