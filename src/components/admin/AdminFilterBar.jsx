import React, { useState } from "react";
import { HiFilter, HiRefresh, HiChevronDown, HiChevronUp, HiX } from "react-icons/hi";

/**
 * Responsive Admin Filter Bar Component
 * Supports min-width 320px (iPhone SE)
 * 
 * @param {Object} props
 * @param {string} props.searchValue - Current search input value
 * @param {function} props.onSearchChange - Search input change handler
 * @param {string} props.searchPlaceholder - Search input placeholder
 * @param {function} props.onSearch - Called on Enter key or search button click
 * @param {Array} props.filters - Array of filter configs: { name, value, onChange, options: [{value, label}] }
 * @param {function} props.onClearFilters - Called when clear filters clicked
 * @param {function} props.onRefresh - Called when refresh button clicked
 * @param {boolean} props.showClear - Show clear filters button
 * @param {React.ReactNode} props.children - Additional content (buttons, etc)
 */
export default function AdminFilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  onSearch,
  filters = [],
  onClearFilters,
  onRefresh,
  showClear = false,
  children,
}) {
  const [expanded, setExpanded] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch();
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800">
      {/* Main Row - Always visible */}
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input - Full width on mobile */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <HiFilter className="w-5 h-5 text-neutral-400 flex-shrink-0 hidden sm:block" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Desktop: Inline filters */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {filters.map((filter, idx) => (
              <select
                key={idx}
                value={filter.value}
                onChange={(e) => filter.onChange?.(e.target.value)}
                className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ))}

            {showClear && (
              <button
                onClick={onClearFilters}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg whitespace-nowrap transition-colors"
              >
                Clear
              </button>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <HiRefresh className="w-5 h-5 text-neutral-500" />
              </button>
            )}

            {children}
          </div>

          {/* Mobile/Tablet: Toggle + Refresh buttons */}
          <div className="flex lg:hidden items-center gap-2 flex-shrink-0">
            {filters.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <HiFilter className="w-4 h-4" />
                <span>Filters</span>
                {expanded ? (
                  <HiChevronUp className="w-4 h-4" />
                ) : (
                  <HiChevronDown className="w-4 h-4" />
                )}
              </button>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <HiRefresh className="w-5 h-5 text-neutral-500" />
              </button>
            )}

            {children}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet: Expanded filters */}
      {expanded && filters.length > 0 && (
        <div className="lg:hidden px-3 sm:px-4 pb-3 sm:pb-4 border-t border-neutral-200 dark:border-neutral-700 pt-3 space-y-3">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            {filters.map((filter, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                {filter.label && (
                  <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {filter.label}
                  </label>
                )}
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange?.(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {showClear && (
            <button
              onClick={() => {
                onClearFilters?.();
                setExpanded(false);
              }}
              className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <HiX className="w-4 h-4" />
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
