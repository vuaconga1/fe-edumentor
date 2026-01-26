import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchBar - Modern reusable search component (Dark Mode Supported)
 * Props:
 * - value: string (current search text)
 * - onChange: function(newValue) - Triggers when typing
 * - onClear: function() - Triggers when X is clicked (optional)
 * - placeholder: string
 * - className: string
 * - isLoading: boolean - Show a loading spinner (optional)
 */
const SearchBar = ({ 
  value, 
  onChange, 
  onClear,
  placeholder = "Search...", 
  className = "", 
  isLoading = false,
  ...rest 
}) => {

  const handleClear = () => {
    onChange(''); 
    if (onClear) onClear(); 
  };

  return (
    <div className={`relative flex items-center w-full max-w-md ${className}`}>
      {/* Search Icon (Left) */}
      <div className="absolute left-3 text-gray-400 dark:text-gray-500 pointer-events-none">
        <Search size={20} />
      </div>

      {/* Input Field */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all shadow-sm 
                 bg-white dark:bg-neutral-900 
                 border border-gray-200 dark:border-gray-700 
                 text-gray-700 dark:text-gray-200
                 placeholder-gray-400 dark:placeholder-gray-500
                 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/30 focus:border-blue-500 dark:focus:border-blue-500
                 hover:border-gray-300 dark:hover:border-gray-600"
        {...rest}
      />

      {/* Right Actions: Loading Spinner or Clear Button */}
      <div className="absolute right-3 flex items-center">
        {isLoading ? (
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
        ) : value ? (
          <button
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 
                     transition-colors focus:outline-none p-0.5 rounded-full 
                     hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default SearchBar;
