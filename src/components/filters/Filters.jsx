import React from 'react';
import { X, ChevronDown, Check, Filter as FilterIcon } from 'lucide-react';

/**
 * Filters - Modern Reusable Filter Component (With Dark Mode Support)
 * Props:
 * - filters: Array of config objects
 * - values: Object storing current values
 * - onChange: function(name, value)
 * - onReset: function() (optional) - Reset all filters
 * - className: string
 */
const Filters = ({ filters = [], values = {}, onChange, onReset, className = "" }) => {
  
  // Helper to check if checkbox is active
  const isCheckboxActive = (name, value) => {
    return Array.isArray(values[name]) && values[name].includes(value);
  };

  return (
    <div className={`bg-white dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors duration-300 ${className}`}>
      {/* Header + Reset Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-neutral-800 dark:text-white font-semibold flex items-center gap-2">
          <FilterIcon size={18} className="text-blue-600 dark:text-blue-400" />
          Search Filters
        </h3>
        {onReset && (
          <button 
            onClick={onReset}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
          >
            <X size={14} /> Reset all
          </button>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filters.map((filter) => {
          
          /* --- TYPE: SELECT (Updated with Reset Button) --- */
          if (filter.type === 'select') {
            const hasValue = values[filter.name] && values[filter.name] !== '';
            
            return (
              <div key={filter.name} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 ml-1">{filter.label}</label>
                <div className="relative group">
                  <select
                    className="w-full pl-3 pr-10 py-2.5 rounded-lg text-sm transition-all appearance-none cursor-pointer
                             bg-neutral-50 dark:bg-neutral-950 
                             border border-neutral-200 dark:border-neutral-800 
                             text-neutral-700 dark:text-neutral-200
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500
                             hover:bg-white dark:hover:bg-neutral-900"
                    value={values[filter.name] || ''}
                    onChange={e => onChange(filter.name, e.target.value)}
                  >
                    <option value="">All</option>
                    {filter.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  
                  {/* Actions Container (Reset + Arrow) */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                    {/* Individual Reset Button (Only shows if value exists) */}
                    {hasValue && (
                      <button
                        type="button"
                        onClick={(e) => {
                            // Ngăn sự kiện click xuyên qua select (nếu trình duyệt hỗ trợ pointer-events trên container cha)
                            // Nhưng vì chúng ta để pointer-events-none ở div cha để click select được, 
                            // nên ta cần bật lại pointer-events-auto cho nút này.
                        }}
                        // Logic thực tế nằm ở CSS pointer-events
                        className="pointer-events-auto p-1 rounded-full text-neutral-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                        onMouseDown={(e) => {
                           e.preventDefault(); // Ngăn việc mở dropdown khi click nút X
                           e.stopPropagation();
                           onChange(filter.name, ''); // Reset giá trị
                        }}
                      >
                        <X size={14} />
                      </button>
                    )}
                    
                    {/* Arrow Icon */}
                    <ChevronDown className={`text-neutral-400 dark:text-neutral-500 transition-opacity ${hasValue ? 'hidden group-hover:block' : 'block'}`} size={16} />
                  </div>
                </div>
              </div>
            );
          }

          /* --- TYPE: CHECKBOX (Pills/Badges) --- */
          if (filter.type === 'checkbox') {
            return (
              <div key={filter.name} className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 ml-1">{filter.label}</label>
                <div className="flex flex-wrap gap-2">
                  {filter.options.map(opt => {
                    const active = isCheckboxActive(filter.name, opt.value);
                    return (
                      <label 
                        key={opt.value} 
                        className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium border transition-all select-none flex items-center gap-1.5
                          ${active 
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm' 
                            : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                          }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={active}
                          onChange={e => {
                            const checked = e.target.checked;
                            let newVals = Array.isArray(values[filter.name]) ? [...values[filter.name]] : [];
                            if (checked) newVals.push(opt.value);
                            else newVals = newVals.filter(v => v !== opt.value);
                            onChange(filter.name, newVals);
                          }}
                        />
                        {active && <Check size={12} />}
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }

          /* --- TYPE: RADIO (Segmented Control) --- */
          if (filter.type === 'radio') {
            return (
              <div key={filter.name} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300 ml-1">{filter.label}</label>
                <div className="flex bg-neutral-100 dark:bg-neutral-950 p-1 rounded-lg">
                  {filter.options.map(opt => {
                    const active = values[filter.name] === opt.value;
                    return (
                      <label 
                        key={opt.value} 
                        className={`flex-1 text-center cursor-pointer py-1.5 px-3 rounded-md text-xs font-medium transition-all select-none
                          ${active 
                            ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                          }`}
                      >
                        <input
                          type="radio"
                          className="hidden"
                          name={filter.name}
                          checked={active}
                          onChange={() => onChange(filter.name, opt.value)}
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default Filters;