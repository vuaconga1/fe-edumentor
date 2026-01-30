import React, { useState, useRef, useEffect } from "react";
import { HiChevronDown } from "react-icons/hi";

const CustomSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
  className = "",
  dropdownClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Find selected option label
  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-700 dark:text-neutral-300 text-sm font-medium flex items-center justify-between gap-2 focus:ring-2 focus:ring-primary-500 transition-all outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? "ring-2 ring-primary-500" : ""
        }`}
      >
        <span className={`truncate ${!selectedOption ? "text-neutral-400" : ""}`}>
          {displayText}
        </span>
        <HiChevronDown
          className={`w-5 h-5 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-30 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg max-h-60 overflow-y-auto ${dropdownClassName}`}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                value === option.value
                  ? "bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium"
                  : "text-neutral-700 dark:text-neutral-300"
              }`}
            >
              {option.label}
            </button>
          ))}
          {options.length === 0 && (
            <div className="px-4 py-3 text-sm text-neutral-500">No options available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
